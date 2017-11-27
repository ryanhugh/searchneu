/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import mkdirp from 'mkdirp-promise';
import elasticlunr from 'elasticlunr';
import _ from 'lodash';
import objectHash from 'object-hash';
import fs from 'fs-promise';
import path from 'path';

import macros from '../../macros';
import neuEmployees from './employees';
import ccisFaculty from './ccis';
import coeFaculty from './coe';
import csshFaculty from './cssh';
import camdFaculty from './camd';

// This file combines the data from the ccis website and the NEU Employees site
// If there is a match, the data from the ccis site has priority over the data from the employee site.
// Matching is first done by email (which is scraped from both sites) and then by name
// Email is a great way to match people, but Name is not because some people use nicknames

// TODO:
// the only name on the output object is the ccis name if there was a match and the employee name if there was not
// Could keep both, or keep the output of the first name/last name logic
// Or maybe if keeping employee name put the first name first so it is in the same order as the ccis name
// Names on the output from this file are "bob smith" and not "smith, bob", even if there was no match

// Possible checks:
// How often people have conflicting data field when merging (eg different phone numbers)


// name

// url.

// Phone. Many people have one database say one phone and a different data source have a different phone. idk.
// phone: '6175586587'

// List of emails. Can be on any domain. Many people list personal emails. Duplicates are removed.
// emails : ['bob@northeastern.edu']

// primaryRole. What their job is. eg: Professor

// What department they work in. eg: CCIS
// primaryDepartment

// officeRoom: 435 Ryder Hall
// officeStreetAddress: 177 Huntington Ave

class CombineCCISandEmployees {
  constructor() {
    // Keep track of things that can happen during matching.
    // Output analytics and some statistics after merging each list.
    this.analytics = {};
  }

  resetAnalytics() {
    this.analytics = {};
  }

  logAnalyticsEvent(eventName) {
    if (this.analytics[eventName] === undefined) {
      this.analytics[eventName] = 0;
    }
    this.analytics[eventName]++;
  }


  okToMatch(matchObj, person, peopleListIndex) {
    if (person.emails) {
      const emailDomainMap = {};

      matchObj.emails.forEach((email) => {
        const domain = email.split('@')[1];
        emailDomainMap[domain] = email;
      });

      for (const email of person.emails) {
        const domain = email.split('@')[1];
        if (emailDomainMap[domain] && emailDomainMap[domain] !== email) {
          this.logAnalyticsEvent('emailDomainMismatch');

          macros.log('Not matching people because they had different emails on the same domain.', emailDomainMap[domain], email);
          return false;
        }
      }
    }

    if (matchObj.peopleListIndexMatches[peopleListIndex]) {
      this.logAnalyticsEvent('sameListNotMatching');
      macros.log('Not matching ', matchObj.firstName, matchObj.lastName, 'and ', person.name, 'because they came from the same list.');
      return false;
    }

    return true;
  }


  async main(peopleLists) {
    peopleLists = await Promise.all([neuEmployees.main(), ccisFaculty.main(), coeFaculty.main(), csshFaculty.main(), camdFaculty.main()]);

    const mergedPeopleList = [];

    let peopleListIndex = 0;


    // First, match people from the different data sources. The merging happens after the matching
    for (const peopleList of peopleLists) {
      macros.log('At people list index', peopleListIndex);

      this.resetAnalytics();

      for (const person of peopleList) {
        let matchesFound = 0;
        this.logAnalyticsEvent('people');

        // Skip to the adding for everyone in the first data set
        // Attempt to match by email
        if (person.emails && peopleListIndex > 0) {
          for (const matchedPerson of mergedPeopleList) {
            // Emails did not overlap at all. Go to next person.
            if (_.intersection(matchedPerson.emails, person.emails).length === 0) {
              continue;
            }

            // Final checks to see if it is ok to declare a match.
            if (!this.okToMatch(matchedPerson, person, peopleListIndex)) {
              macros.log('Not ok to match 1.', matchedPerson.firstName, matchedPerson.lastName, person.name);
              continue;
            }


            // Found a match.
            matchedPerson.matches.push(person);

            // Update the emails array with the new emails from this person.
            matchedPerson.emails = _.uniq(matchedPerson.emails.concat(person.emails));
            matchedPerson.peopleListIndexMatches[peopleListIndex] = true;

            // There should only be one match per person. Log a warning if there are more.
            matchesFound++;
            this.logAnalyticsEvent('matchedByEmail');
            if (matchesFound > 1) {
              macros.log('Warning 1: ', matchesFound, 'matches found', matchedPerson, person);
            }
          }
        }

        // The rest of this code requires both a first name and a last name
        if (!person.firstName || !person.lastName) {
          this.logAnalyticsEvent('missingNameUnmatchedEmail');
          macros.log("Don't have person first name or last name and did not match with email.", person);
          continue;
        }


        // Try to match by perfect name matches. If this fails then fallback to ghetto name matches.
        if (matchesFound === 0 && peopleListIndex > 0) {
          for (const matchedPerson of mergedPeopleList) {
            const firstMatch = person.firstName.toLowerCase() === matchedPerson.firstName.toLowerCase();
            const lastMatch = person.lastName.toLowerCase() === matchedPerson.lastName.toLowerCase();

            // If both the first names and last names did not match, go to next person
            if (!firstMatch || !lastMatch) {
              continue;
            }

            // Final checks to see if it is ok to declare a match.
            if (!this.okToMatch(matchedPerson, person, peopleListIndex)) {
              macros.log('Not ok to perfect name match.', matchedPerson.firstName, matchedPerson.lastName, person.name);
              continue;
            }

            // Found a match.
            matchedPerson.matches.push(person);

            // Update the emails array with the new emails from this person.
            matchedPerson.emails = _.uniq(matchedPerson.emails.concat(person.emails));
            matchedPerson.peopleListIndexMatches[peopleListIndex] = true;

            macros.log('Matching:', person.firstName, person.lastName, ':', matchedPerson.firstName, matchedPerson.lastName);

            // There should only be one match per person. Log a warning if there are more.
            this.logAnalyticsEvent('matchedByPerfectName');
            matchesFound++;
            if (matchesFound > 1) {
              macros.log('Warning 4: ', matchesFound, 'matches found', matchedPerson, person);
            }
          }
        }

        // If a match was not found yet, try to match by name
        // Skip the first data set (peopleListIndex > 0) because that would just be matching people with that same data set.
        if (matchesFound === 0 && peopleListIndex > 0) {
          // Now try to match by name
          // Every data source must have a person name, so no need to check if it is here or not.
          for (const matchedPerson of mergedPeopleList) {
            const personFirstNameLower = person.firstName.toLowerCase();
            const personLastNameLower = person.lastName.toLowerCase();

            const matchedPersonFirstNameLower = matchedPerson.firstName.toLowerCase();
            const matchedPersonLastNameLower = matchedPerson.lastName.toLowerCase();

            const firstMatch = personFirstNameLower.includes(matchedPersonFirstNameLower) || matchedPersonFirstNameLower.includes(personFirstNameLower);
            const lastMatch = personLastNameLower.includes(matchedPersonLastNameLower) || matchedPersonLastNameLower.includes(personLastNameLower);

            // If both the first names and last names did not match, go to next person
            if (!firstMatch || !lastMatch) {
              continue;
            }

            // Final checks to see if it is ok to declare a match.
            if (!this.okToMatch(matchedPerson, person, peopleListIndex)) {
              macros.log('Not ok to match 2.', matchedPerson.firstName, matchedPerson.lastName, person.name);
              continue;
            }

            // Found a match.
            matchedPerson.matches.push(person);

            // Update the emails array with the new emails from this person.
            matchedPerson.emails = _.uniq(matchedPerson.emails.concat(person.emails));
            matchedPerson.peopleListIndexMatches[peopleListIndex] = true;

            macros.log('Matching:', person.firstName, person.lastName, ':', matchedPerson.firstName, matchedPerson.lastName);

            // There should only be one match per person. Log a warning if there are more.
            this.logAnalyticsEvent('matchedByName');
            matchesFound++;
            if (matchesFound > 1) {
              macros.log('Warning 2: ', matchesFound, 'matches found', matchedPerson, person);
            }
          }
        }

        // If still has no match, add to the end of the matchedArray and generate phone and matching lastName and firstName
        // If there was a match, update the list of emails to match with
        if (matchesFound === 0) {
          const newMatchPerson = {
            matches: [person],
            emails: [],
            firstName: person.firstName,
            lastName: person.lastName,
            peopleListIndexMatches: {},
          };

          newMatchPerson.peopleListIndexMatches[peopleListIndex] = true;

          if (person.emails) {
            newMatchPerson.emails = person.emails.slice(0);
          }

          if (peopleListIndex > 1) {
            macros.log('Adding', person.firstName, person.lastName);
          }
          if (person.primaryRole === 'PhD Student') {
            this.logAnalyticsEvent('unmatched PhD Student');
          }

          mergedPeopleList.push(newMatchPerson);
        } else if (matchesFound > 1) {
          macros.error(matchesFound, 'matches found for ', person.name, '!!!!');
        }
      }

      // Do some final calculations on the analytics and then log them
      if (this.analytics.matchedByEmail !== undefined && this.analytics.matchedByName !== undefined) {
        this.analytics.matched = this.analytics.matchedByEmail + this.analytics.matchedByName;
        this.analytics.unmatched = this.analytics.people - this.analytics.matched;
      }

      macros.log(JSON.stringify(this.analytics, null, 4));
      peopleListIndex++;
    }

    // This file is just used for debugging. Used to see which profiles are going to be merged with which other profiles.
    if (macros.DEV) {
      const toSave = [];

      mergedPeopleList.forEach((item) => {
        if (item.matches.length > 1) {
          toSave.push(item);
        }
      });

      await mkdirp(macros.PUBLIC_DIR);
      await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employeeMatches.json'), JSON.stringify(toSave, null, 4));
    }


    const mergedEmployees = [];


    mergedPeopleList.forEach((person) => {
      if (person.matches.length === 1) {
        mergedEmployees.push(person.matches[0]);
        return;
      }


      const output = {};
      for (const profile of person.matches) {
        for (const attrName in profile) {
          // Merge emails
          if (attrName === 'emails') {
            if (output.emails) {
              output.emails = _.uniq(output.emails.concat(profile.emails));
            } else {
              output.emails = profile.emails;
            }
            continue;
          }

          if (output[attrName] && output[attrName] !== profile[attrName]) {
            macros.log('Overriding ', output[attrName], '\twith', profile[attrName]);
          }


          output[attrName] = profile[attrName];
        }
      }

      mergedEmployees.push(output);
    });


    // Add IDs to people that don't have them (IDs are only scraped from employee directory)
    const startTime = Date.now();
    mergedEmployees.forEach((person, index) => {
      if (person.id) {
        return;
      }

      mergedEmployees[index].id = objectHash(person);
    });

    macros.log('Spent', Date.now() - startTime, 'ms generating object hashes for employees without IDs.');


    // Save the file
    await mkdirp(macros.PUBLIC_DIR);
    await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employees.json'), JSON.stringify(mergedEmployees, null, 4));


    // Create a map so the frontend is faster
    const employeeMap = {};
    mergedEmployees.forEach((person) => {
      if (!person.id) {
        macros.error('Error, need id to make map!', person);
      }
      if (employeeMap[person.id]) {
        macros.error('Error, duplicate id!', person.id);
      }
      employeeMap[person.id] = person;
    });


    // And save that too
    await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employeeMap.json'), JSON.stringify(employeeMap));


    // Make a search index
    const index = elasticlunr();
    index.saveDocument(false);

    index.setRef('id');
    index.addField('name');
    index.addField('phone');
    index.addField('emails');

    // Enable in search.js if this is enabled again.
    // index.addField('officeRoom');
    index.addField('primaryRole');
    index.addField('primaryDepartment');
    index.saveDocument(false);

    mergedEmployees.forEach((row) => {
      const docToIndex = {};
      Object.assign(docToIndex, row);

      // If their middle name is one character (not including symbols), don't add it to the search index.
      // This prevents profs like Stacy C. Marsella from coming up when you type in [C]
      // First, remove the first and last names and toLowerCase()
      // Remove the middle name from the name to index if the middle name (not including symbols) is 1 or 0 characters.
      docToIndex.name = macros.stripMiddleName(row.name, true, row.firstName, row.lastName);

      if (docToIndex.emails) {
        for (let i = 0; i < docToIndex.emails.length; i++) {
          // Remove the @northeastern.edu and @neu.edu from the index to prevent indexing unnecessary stuff.
          if (docToIndex.emails[i].endsWith('northeastern.edu')) {
            docToIndex.emails[i] = docToIndex.emails[i].slice(0, docToIndex.emails[i].indexOf('@northeastern.edu'));
          }

          if (docToIndex.emails[i].endsWith('neu.edu')) {
            docToIndex.emails[i] = docToIndex.emails[i].slice(0, docToIndex.emails[i].indexOf('@neu.edu'));
          }
        }

        docToIndex.emails = docToIndex.emails.join(' ');
      }

      index.addDoc(docToIndex);
    });


    await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employeesSearchIndex.json'), JSON.stringify(index.toJSON()));
    macros.log('wrote employee json files');
  }
}

const instance = new CombineCCISandEmployees();
export default instance;

if (require.main === module) {
  instance.main();
}
