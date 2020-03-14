/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import { Op } from 'sequelize';

import elastic from './elastic';

import Bannerv9Parser from './scrapers/classes/parsersxe/bannerv9Parser';
import macros from './macros';
import Keys from '../common/Keys';
import notifyer from './notifyer';
import dumpProcessor from './dumpProcessor';
import { Course, Section, sequelize } from './database/models/index';
import HydrateSerializer from './database/serializers/hydrateSerializer';

class Updater {
  // Don't call this directly, call .create instead.
  constructor() {
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
    this.onInterval();
  }


  static create() {
    return new this();
  }

  // This runs every couple of minutes and checks to see if any seats opened (or anything else changed) in any of the classes that people are watching
  // The steps of this process:
  // Fetch the user data from the database.
  // List the classes and sections that people are watching
  //   - This data is stored as hashes (Keys...getHash()) in the user DB
  // Access the data stored in elasticsearch
  // Access the URLs from these objects and use them to scrape the latest data about these classes
  // Compare with the existing data
  // Notify users about any changes
  // Update the local data about the changes
  async onInterval() {
    macros.log('updating');

    if (macros.DEV) {
      return;
    }

    const startTime = Date.now();

    const classHashToUsers = {};
    const sectionHashToUsers = {};

    (await sequelize.query('SELECT "courseId", ARRAY_AGG("userId") FROM "FollowedCourses" GROUP BY "courseId"', { type: sequelize.QueryTypes.SELECT }))
      .forEach((classHash) => {
        classHashToUsers[classHash.courseId] = classHash.array_agg;
      });

    (await sequelize.query('SELECT "sectionId", ARRAY_AGG("userId") FROM "FollowedSections" GROUP BY "sectionId"', { type: sequelize.QueryTypes.SELECT }))
      .forEach((sectionHash) => {
        sectionHashToUsers[sectionHash.sectionId] = sectionHash.array_agg;
      });

    const classHashes = Object.keys(classHashToUsers);
    const sectionHashes = Object.keys(sectionHashToUsers);

    if (classHashes.length === 0 && sectionHashes.length === 0) {
      return;
    }

    macros.log('watching classes ', classHashes.length);

    // Get the old data for watched classes
    const oldDocs = await (new HydrateSerializer(Section)).bulkSerialize(await Course.findAll({ where: { id: { [Op.in]: classHashes } } }));

    const oldWatchedClasses = _.mapValues(oldDocs, (doc) => { return doc.class; });
    const oldWatchedSections = {};
    for (const aClass of Object.values(oldDocs)) {
      for (const section of aClass.sections) {
        oldWatchedSections[Keys.getSectionHash(section)] = section;
      }
    }

    // Track all section hashes of classes that are being watched. Used for sanity check
    const sectionHashesOfWatchedClasses = Object.keys(oldWatchedSections);

    // Sanity check: Find the sections that are being watched, but are not part of a watched class
    for (const sectionHash of _.difference(sectionHashes, sectionHashesOfWatchedClasses)) {
      macros.warn('Section', sectionHash, "is being watched but it's class is not being watched?");
    }

    // Scrape the latest data
    const promises = Object.values(oldWatchedClasses).map(async (aClass) => {
      const promise = await Bannerv9Parser.scrapeClass(aClass.termId, aClass.subject, aClass.classId);
      const { classes, sections } = promise;
      if (classes.length === 1) {
        classes[0].sections = sections;
        return { classes: classes, sections: sections };
      }
      return null;
    });


    let output;

    try {
      output = await Promise.all(promises);
    } catch (e) {
      macros.warn('bannerv9parser call failed in updater with error:', e);
      return;
    }

    // Remove any instances where the output was null.
    // This can happen if the class at one of the urls that someone was watching dissapeared or was taken down
    // In this case the output of the ellucianCatalogParser will be null.
    _.pull(output, null);

    // concat classes and section arrays
    output = _.mergeWith(...output, (a, b) => { return a.concat(b); });

    // Keep track of which messages to send which users.
    // The key is the facebookMessengerId and the value is a list of messages.
    const userToMessageMap = {};

    for (const aNewClass of output.classes) {
      const hash = Keys.getClassHash(aNewClass);

      const oldClass = oldWatchedClasses[hash];

      // Count how many sections are present in the new but not in the old.
      let count = 0;
      if (aNewClass.sections) {
        const newCrns = aNewClass.sections.map((section) => { return section.crn; });
        const oldCrns = (oldClass.sections || []).map((section) => { return section.crn; });

        for (const crn of newCrns) {
          if (!oldCrns.includes(crn)) {
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
      const hash = Keys.getSectionHash(newSection);
      const oldSection = oldWatchedSections[hash];

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

    const classMap = {};
    for (const aClass of output.classes) {
      // Sort each classes section by crn.
      // This will keep the sections the same between different scrapings.
      if (aClass.sections.length > 1) {
        aClass.sections.sort((a, b) => {
          return a.crn > b.crn;
        });
      }
      classMap[Keys.getClassHash(aClass)] = {
        class: {
          lastUpdateTime: aClass.lastUpdateTime,
        },
        sections: aClass.sections,
      };
    }
    await elastic.bulkUpdateFromMap(elastic.CLASS_INDEX, classMap);
    await dumpProcessor.main({ termDump: output });

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

export default Updater;
