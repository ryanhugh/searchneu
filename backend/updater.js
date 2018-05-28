/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

import DataLib from '../common/classModels/DataLib';

import classesScrapers from './scrapers/classes/main';

import macros from './macros';
import database from './database';
import Keys from '../common/Keys';
import ellucianCatalogParser from './scrapers/classes/parsers/ellucianCatalogParser';
import notifyer from './notifyer';


class Updater {
  // Don't call this directly, call .create instead.
  constructor(dataLib) {
    this.dataLib = dataLib;

    // 5 min if prod, 30 sec if dev.
    // In dev the cache will be used so we are not actually hitting NEU's servers anyway.
    const intervalTime = macros.PROD ? 300000 : 30000;

    setInterval(() => {
      try {
        this.onInterval();
      } catch (e) {
        macros.warn('Updater failed with :', e);
      }
    }, intervalTime);
  }


  static create(dataLib) {
    if (!dataLib) {
      macros.error('Invalid dataLib', dataLib);
      return null;
    }

    return new this(dataLib);
  }

  // This runs every couple of minutes and checks to see if any seats opened (or anything else changed) in any of the classes that people are watching
  // The steps of this process:
  // Fetch the user data from the database.
  // List the classes and sections that people are watching
  //   - This data is stored as hashes (Keys...getHash()) in the user DB
  // Access the data stored in RAM in this Node.js process to get the full data about these classes and sections
  //   - This data is passed in through the dataLib argument
  //   - This same instance of the data is also passed into the search class so it can access this same data
  // Access the URLs from these objects and use them to scrape the latest data about these classes
  // Compare with the existing data
  // Notify users about any changes
  // Update the local data about the changes
  async onInterval() {
    const startTime = Date.now();

    let users = await database.get('users');
    if (!users) {
      return;
    }

    users = Object.values(users);

    let classHashes = [];
    let sectionHashes = [];

    const sectionHashToUsers = {};
    const classHashToUsers = {};

    for (const user of users) {
      // Firebase, for some reason, strips leading 0s from the Facebook messenger id.
      // Add them back here.

      if (!user.facebookMessengerId) {
        macros.warn('User has no FB id?', JSON.stringify(user));
        continue;
      }

      while (user.facebookMessengerId.length < 16) {
        user.facebookMessengerId = `0${user.facebookMessengerId}`;
      }


      if (!user.watchingClasses) {
        user.watchingClasses = [];
      }

      if (!user.watchingSections) {
        user.watchingSections = [];
      }

      // When an item is deleted from an array in firebase, firebase dosen't shift the rest of the items down one index.
      // Instead, it adds an undefined item to the array.
      // This removes any possible undefined items from the array.
      // The warnings can be added back when unsubscribing is done with code.
      _.pull(user.watchingClasses, null);
      _.pull(user.watchingSections, null);

      classHashes = classHashes.concat(user.watchingClasses);
      sectionHashes = sectionHashes.concat(user.watchingSections);

      for (const classHash of user.watchingClasses) {
        if (!classHashToUsers[classHash]) {
          classHashToUsers[classHash] = [];
        }

        classHashToUsers[classHash].push(user.facebookMessengerId);
      }

      for (const sectionHash of user.watchingSections) {
        if (!sectionHashToUsers[sectionHash]) {
          sectionHashToUsers[sectionHash] = [];
        }

        sectionHashToUsers[sectionHash].push(user.facebookMessengerId);
      }
    }

    // Remove duplicates. This will occur if multiple people are watching the same class.
    classHashes = _.uniq(classHashes);
    sectionHashes = _.uniq(sectionHashes);

    const sectionHashMap = {};

    for (const sectionHash of sectionHashes) {
      const section = this.dataLib.getSectionServerDataFromHash(sectionHash);

      sectionHashMap[sectionHash] = section;
    }


    // Get the data for these hashes
    const classes = [];

    for (const classHash of classHashes) {
      const aClass = this.dataLib.getClassServerDataFromHash(classHash);

      if (!aClass) {
        macros.warn('Unable to fetch class for hash!', classHash);
        continue;
      }

      classes.push(aClass);

      if (aClass.crns) {
        for (const crn of aClass.crns) {
          const sectionHash = Keys.create({
            host: aClass.host,
            termId: aClass.termId,
            subject: aClass.subject,
            classId: aClass.classId,
            crn: crn,
          }).getHash();

          // Remove this one from the hash map
          sectionHashMap[sectionHash] = false;
        }
      }
    }


    // Find the sections that are still around
    for (const sectionHash of Object.keys(sectionHashMap)) {
      // If it was set to false, ignore it
      if (!sectionHashMap[sectionHash]) {
        continue;
      }
      macros.warn('Section', sectionHash, "is being watched but it's class is not being watched?", Object.keys(sectionHashMap));
    }

    // Scrape the latest data
    const promises = classes.map((aClass) => {
      return ellucianCatalogParser.main(aClass.prettyUrl).then((newClass) => {
        if (!newClass) {
          // TODO: This should be changed into a notification that the class probably no longer exists. Shoudn't unsubscribe people.
          macros.warn('New class data is null?', aClass.prettyUrl, aClass);
          return null;
        }


        // Copy over some fields that are not scraped from this scraper.
        newClass.value.host = aClass.host;
        newClass.value.termId = aClass.termId;
        newClass.value.subject = aClass.subject;

        return newClass;
      });
    });

    // Remove the instances where newClass was null
    _.pull(promises, null);

    let allParsersOutput;

    try {
      allParsersOutput = await Promise.all(promises);
    } catch (e) {
      macros.warn('ellucianCatalogParser call failed in updater with error:', e);
      return;
    }

    // Remove any instances where the output was null.
    // This can happen if the class at one of the urls that someone was watching dissapeared or was taken down
    // In this case the output of the ellucianCatalogParser will be null.
    _.pull(allParsersOutput, null);

    const rootNode = {
      type: 'ignore',
      deps: allParsersOutput,
      value: {},
    };

    // Because ellucianCatalogParser returns a list of classes, instead of a singular class, we need to run it on all of them
    const output = classesScrapers.restructureData(rootNode);

    if (!output.sections) {
      output.sections = [];
    }

    if (!output.classes) {
      output.classes = [];
    }

    // Keep track of which terms have classes that we are updating.
    const updatingTerms = {};
    for (const aClass of classes) {
      updatingTerms[aClass.termId] = true;
    }

    for (const termId of Object.keys(updatingTerms)) {
      // Copy over every class we didn't just update from the old data.
      const oldClasses = this.dataLib.getClassesInTerm(termId);

      for (const aClass of oldClasses) {
        const hash = Keys.create(aClass).getHash();

        // TODO: Change this from classHashes to a hash of the output classes after the re-factor away classUid
        if (!classHashes.includes(hash)) {
          output.classes.push(aClass);
        }
      }

      const oldSections = this.dataLib.getSectionsInTerm(termId);


      // THIS WILL COPY OVER EVERY section from the old to the new data, even ones that no longer exist in the new data.
      // need a way to figure out how to exclude sections that no longer exist in the new data. TODOOOO
      for (const section of oldSections) {
        const hash = Keys.create(section).getHash();

        // TODO: Change this from classHashes to a hash of the output classes after the re-factor away classUid
        if (!sectionHashes.includes(hash)) {
          output.sections.push(section);
        }
      }
    }

    classesScrapers.runProcessors(output);

    // Keep track of which messages to send which users.
    // The key is the facebookMessengerId and the value is a list of messages.
    const userToMessageMap = {};

    for (const aNewClass of output.classes) {
      const hash = Keys.create(aNewClass).getHash();

      const oldClass = this.dataLib.getClassServerDataFromHash(hash);

      // Count how many sections are present in the new but not in the old.
      let count = 0;
      if (aNewClass.crns) {
        for (const crn of aNewClass.crns) {
          if (!oldClass.crns.includes(crn)) {
            count++;
          }
        }
      }

      let message = '';
      const classCode = `${aNewClass.subject} ${aNewClass.classId}`;

      if (count === 1) {
        message = `A section was added to ${classCode}!`;
      } else if (count > 1) {
        message = `${count} sections were added to ${classCode}!`;
      }

      if (message) {
        // If there is no space between the classId and the exclamation mark
        // Facebook Messenger on mobile will include the exclamation mark in the hyperlink
        // Oddly enough, Facebook messenger on desktop will not include the exclamation mark in the URL.
        message += ` Check it out at https://searchneu.com/${aNewClass.termId}/${aNewClass.subject}${aNewClass.classId} !`;

        // Get the list of users who were watching this class
        const usersToMessage = classHashToUsers[hash];
        if (!usersToMessage) {
          continue;
        }

        // Send them all a notification.
        for (const user of usersToMessage) {
          if (!userToMessageMap[user]) {
            userToMessageMap[user] = [];
          }

          userToMessageMap[user].push(message);
        }
      }
    }

    for (const newSection of output.sections) {
      const hash = Keys.create(newSection).getHash();

      const oldSection = this.dataLib.getSectionServerDataFromHash(hash);

      // This may run in the odd chance that that the following 3 things happen:
      // 1. a user signes up for a section.
      // 2. the section dissapears (eg. it is removed from Banner).
      // 3. the section re appears again.
      // If this happens just ignore it for now, but the best would probably to be notifiy if there are seats open now
      if (!oldSection) {
        macros.warn('Section was added?', hash, newSection, sectionHashToUsers, classHashToUsers);
        continue;
      }

      let message;

      if (newSection.seatsRemaining > 0 && oldSection.seatsRemaining <= 0) {
        // See above comment about space before the exclamation mark.
        message = `A seat opened up in ${newSection.subject} ${newSection.classId} (CRN: ${newSection.crn}). Check it out at https://searchneu.com/${newSection.termId}/${newSection.subject}${newSection.classId} !`;
      } else if (newSection.waitRemaining > 0 && oldSection.waitRemaining <= 0) {
        message = `A waitlist seat opened up in ${newSection.subject} ${newSection.classId} (CRN: ${newSection.crn}). Check it out at https://searchneu.com/${newSection.termId}/${newSection.subject}${newSection.classId} !`;
      }

      if (message) {
        const usersToMessage = sectionHashToUsers[hash];
        if (!usersToMessage) {
          continue;
        }

        for (const user of usersToMessage) {
          if (!userToMessageMap[user]) {
            userToMessageMap[user] = [];
          }

          userToMessageMap[user].push(message);
        }
      }
    }

    // Update dataLib with the updated termDump
    // If we ever move to a real database, we would want to change this so it only updates the classes that the scrapers found.
    for (const aClass of output.classes) {
      this.dataLib.setClass(aClass);
    }

    for (const section of output.sections) {
      this.dataLib.setSection(section);
    }


    // Loop through the messages and send them.
    // Do this as the very last stage on purpose.
    // If something crashes/breaks above, the new data is saved to the database
    // and does not cause a notification to be sent to users every five minutes
    // (because the new data will be saved, the next time this runs it will compare against the new data)
    // If this is ran before the data is saved, this could happen:
    // Fetch new data -> send notification -> crash (repeat), and never save the updated data.
    for (const fbUserId of Object.keys(userToMessageMap)) {
      for (const message of userToMessageMap[fbUserId]) {
        notifyer.sendFBNotification(fbUserId, message);
      }
      setTimeout(((facebookUserId) => {
        notifyer.sendFBNotification(facebookUserId, 'Reply with "stop" to unsubscribe from notifications.');
      }).bind(this, fbUserId), 100);

      macros.logAmplitudeEvent('Facebook message sent out', {
        toUser: fbUserId,
        messages: userToMessageMap[fbUserId],
        messageCount: userToMessageMap[fbUserId].length,
      });
    }


    const totalTime = Date.now() - startTime;

    macros.log('Done running updater onInterval. It took', totalTime, 'ms.');

    macros.logAmplitudeEvent('Updater', {
      totalTime: totalTime,
    });
  }
}


async function getFrontendData(dataPath) {
  const body = await fs.readFile(dataPath);
  return JSON.parse(body);
}

async function test() {
  const termDumpPromise = getFrontendData('./public/data/v2/getTermDump/neu.edu/201910.json');

  const spring2018DataPromise = getFrontendData('./public/data/v2/getTermDump/neu.edu/201830.json');

  const userData = await fs.readFile(path.join(__dirname, 'tests', 'data', 'updater.data.json'), 'utf8');

  const fallData = await termDumpPromise;

  const springData = await spring2018DataPromise;

  const dataLib = DataLib.loadData({
    201910: fallData,
    201830: springData,
  });

  // const newUser = {
  //   watchingSections: [
  //     'neu.edu/201910/ENGW/3302/12812',
  //     'neu.edu/201910/ENGW/3302/12813',
  //     'neu.edu/201910/ENGW/3302/12815',
  //     'neu.edu/201910/ENGW/3302/17377',
  //     'neu.edu/201910/ENGW/3302/12814',
  //     'neu.edu/201910/ENGW/3302/13006',
  //     'neu.edu/201910/ENGW/3302/12811',
  //     'neu.edu/201910/ENGW/3302/12816',
  //     'neu.edu/201910/ENGW/3302/12810',
  //     'neu.edu/201910/ENGW/3302/17376',
  //     'neu.edu/201910/ENGW/3302/15027',
  //     'neu.edu/201910/ENGW/3302/13005',
  //     'neu.edu/201910/CS/1100/11293',
  //     'neu.edu/201910/CS/1100/14657',
  //     'neu.edu/201910/CS/1100/14656',
  //     'neu.edu/201910/CS/1100/11294',
  //     'neu.edu/201910/CS/1100/14652',
  //     'neu.edu/201910/CS/1100/14653',
  //     'neu.edu/201910/CS/1100/14658',
  //     'neu.edu/201910/CS/1100/14659',
  //     'neu.edu/201910/CS/1100/11291',
  //     'neu.edu/201910/CS/1100/11292',
  //     'neu.edu/201910/CS/1100/13186',
  //     'neu.edu/201910/CS/1100/11295',
  //     'neu.edu/201910/CS/1100/14654',
  //     'neu.edu/201910/CS/1100/14660',
  //     'neu.edu/201910/CS/1100/11296',
  //     'neu.edu/201910/CS/1100/14655',
  //     'neu.edu/201910/CS/1100/14661',
  //   ],
  //   watchingClasses: ['neu.edu/201910/CS/1100', 'neu.edu/201910/ENGW/3302'],
  //   firstName: 'Test Fistname',
  //   lastName: 'Test Lastname',
  //   facebookMessengerId: '1111111111111111',
  //   facebookPageId: '12345678',
  //   loginKeys: ['123'],
  // };

  database.set('users', JSON.parse(userData));

  const instance = Updater.create(dataLib);

  instance.onInterval();
}

if (require.main === module) {
  test();
}

export default Updater;
