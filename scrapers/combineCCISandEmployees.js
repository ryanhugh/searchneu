import removeAccents from 'remove-accents';
import mkdirp from 'mkdirp-promise';
import elasticlunr from 'elasticlunr';
import _ from 'lodash';

import fs from 'fs-promise';
import path from 'path';
import utils from './utils';
import macros from './macros';
import ccisFaculty from './neuCCISFaculty';
import neuEmployees from './neuEmployees';
import coeFaculty from './neuCOEFaculty';
import csshFaculty from './neuCSSHFaculty';
import camdFaculty from './camdSpider';

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


// TODO
// if they have 2 different emails on the same domain don't match
// if they are in the same index don't match

class CombineCCISandEmployees {

  constructor() {

    // Keep track of things that can happen during matching.
    // Output analytics and some statistics after merging each list.
    this.analytics = {}
  }

  mergePeople(ccisProf, employee) {
    utils.log('going to merge ', ccisProf.name, 'and ', employee.name);

    const output = {};

    const ccisEmail = ccisProf.email;
    const employeeEmail = employee.email;

    // Name is taken from the ccis profile because it is better data source.
    // For people with multiple middle names and such, it seems to include just the importiant ones.
    Object.assign(output, employee, ccisProf);

    // Clear out the email, because we are going to save an array of both instead
    output.email = undefined;

    // Keep both emails
    output.emails = [];
    if (ccisEmail) {
      output.emails.push(ccisEmail);
    }

    if (employeeEmail && employeeEmail !== ccisEmail) {
      output.emails.push(employeeEmail);
    }

    return output;
  }

  findMatchByName(employees, ccisProf) {
    for (const employee of employees) {
      const ccisCompareName = removeAccents(ccisProf.name);

      const {
        firstName,
        lastName,
      } = this.getFirstLastName(employee);

      // It would be better to split each name into first name and last name
      // And compare those individually
      // But a good chunk of names would fail if we did that instead of just a .includes
      // eg. going to merge  [Panagiotos (Pete) Manolios](ccis) and  [Manolios, Pete](employee)
      if (ccisCompareName.includes(firstName) && ccisCompareName.includes(lastName)) {
        return employee;
      }
    }
    return null;
  }


  resetAnalytics() {
    this.analytics = {}
  }

  logAnalyticsEvent(eventName) {
    if (this.analytics[eventName] === undefined) {
      this.analytics[eventName] = 0
    }
    this.analytics[eventName] ++;
  }


  okToMatch(matchObj, person, peopleListIndex) {
    if (person.emails) {
      let emailDomainMap = {}

      matchObj.emails.forEach(function (email) {
        let domain = email.split('@')[1]
        emailDomainMap[domain] = email
      })

      for (let email of person.emails) {
        let domain = email.split('@')[1]
        if (emailDomainMap[domain] && emailDomainMap[domain] !== email) {

          this.logAnalyticsEvent('emailDomainMismatch');

          console.log('Not matching people because they had different emails on the same domain.', emailDomainMap[domain], email)
          return false;
        }
      }
    }

    if (matchObj.peopleListIndexMatches[peopleListIndex]) {
      this.logAnalyticsEvent('sameListNotMatching');
      console.log('Not matching ', matchObj.firstName, matchObj.lastName, 'and ', person.name,'because they came from the same list.')
      return false;
    }

    return true;
  }


  async main(peopleLists) {
    const ccis = await ccisFaculty.main();
    const employees = await neuEmployees.go();
    const coe = await coeFaculty.main();
    const cssh = await csshFaculty.main();
    const camd = await camdFaculty.main();

    peopleLists = [employees, ccis, coe, cssh, camd];

    const mergedPeopleList = [];

    let peopleListIndex = 0


    // First, match people from the different data sources. The merging happens after the matching
    for (const peopleList of peopleLists) {
      peopleListIndex ++;
      console.log('At people list index', peopleListIndex)

      this.resetAnalytics();

      for (const person of peopleList) {
        let matchesFound = 0;
        this.logAnalyticsEvent('people');


        // Attempt to match by email
        if (person.emails) {
          for (const matchedPerson of mergedPeopleList) {

            // Emails did not overlap at all. Go do next person.
            if (_.intersection(matchedPerson.emails, person.emails).length === 0) {
              continue;
            }

            // Final checks to see if it is ok to declare a match. 
            if (!this.okToMatch(matchedPerson, person, peopleListIndex)) {
              console.log('Not ok to match 1.', matchedPerson.firstName, matchedPerson.lastName, person.name)
              continue;
            }


            // Found a match.
            matchedPerson.matches.push(person);

            // Update the emails array with the new emails from this person.
            matchedPerson.emails = _.uniq(matchedPerson.emails.concat(person.emails));

            // There should only be one match per person. Log a warning if there are more.
            matchesFound++;
            this.logAnalyticsEvent('matchedByEmail');
            if (matchesFound > 1) {
              console.log('Warning 1: ', matchesFound, 'matches found', matchedPerson, person);
            }
          }
        }

        // The rest of this code requires both a first name and a last name
        if (!person.firstName || !person.lastName) {
          this.logAnalyticsEvent('missingNameUnmatchedEmail');
          console.log("Don't have person first name or last name and did not match with email.", person);
          continue;
        }


        // If a match was not found yet, try to match by name
        if (matchesFound === 0) {
          // Now try to match by name
          // Every data source must have a person name, so no need to check if it is here or not.
          for (const matchedPerson of mergedPeopleList) {

            const personFirstNameLower = person.firstName.toLowerCase()
            const personLastNameLower = person.lastName.toLowerCase()

            const matchedPersonFirstNameLower = matchedPerson.firstName.toLowerCase()
            const matchedPersonLastNameLower = matchedPerson.lastName.toLowerCase()

            const firstMatch = personFirstNameLower.includes(matchedPersonFirstNameLower) || matchedPersonFirstNameLower.includes(personFirstNameLower);
            const lastMatch = personLastNameLower.includes(matchedPersonLastNameLower) || matchedPersonLastNameLower.includes(personLastNameLower);

            // If both the first names and last names did not match, go to next person
            if (!firstMatch || !lastMatch) {
              continue;
            }

            // Final checks to see if it is ok to declare a match. 
            if (!this.okToMatch(matchedPerson, person, peopleListIndex)) {
              console.log('Not ok to match 2.', matchedPerson.firstName, matchedPerson.lastName, person.name)
              continue;
            }

            // Found a match.
            matchedPerson.matches.push(person);

            console.log('Matching:', person.firstName, person.lastName, ':', matchedPerson.firstName, matchedPerson.lastName);

            // There should only be one match per person. Log a warning if there are more.
            this.logAnalyticsEvent('matchedByName');
            matchesFound++;
            if (matchesFound > 1) {
              console.log('Warning 2: ', matchesFound, 'matches found', matchedPerson, person);
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
            peopleListIndexMatches: {}
          };

          newMatchPerson.peopleListIndexMatches[peopleListIndex] = true

          if (person.emails) {
            newMatchPerson.emails = person.emails.slice(0);
          }

          if (peopleListIndex > 1) {
            console.log('Adding', person.firstName, person.lastName)
            // console.log(person)
          }

          mergedPeopleList.push(newMatchPerson);
        }
      }

      if (this.analytics.matchedByEmail !== undefined && this.analytics.matchedByName !== undefined) {
        this.analytics.matched = this.analytics.matchedByEmail + this.analytics.matchedByName
        this.analytics.unmatched = this.analytics.people - this.analytics.matched   
      }
      console.log(JSON.stringify(this.analytics, null, 4))



    }

    // console.log(JSON.stringify(mergedPeopleList.slice(0, 10), null, 4));
    return;


    const emailMap = {};

    employees.forEach((employee) => {
      if (employee.email && employee.email !== 'Not Available') {
        if (emailMap[employee.email]) {
          utils.log('two employees had same email??', employee.email);
        }

        emailMap[employee.email] = employee;
      }
    });

    const matchedPeople = [];

    // Match by email. Keep track of the employees and ccis people that were not matched.
    const unmatchedProfs = [];
    const unmatchedEmployes = [];
    let matchedEmails = {};

    ccis.forEach((prof) => {
      // For some reason, some different people across the different data sources can have the same phone number. Cannot match by phone number

      if (prof.email && prof.email.endsWith('@neu.edu')) {
        prof.email = `${prof.email.split('@')[0]}@northeastern.edu`;
      }


      if (prof.email && emailMap[prof.email]) {
        matchedEmails[prof.email] = true;
        matchedPeople.push(this.mergePeople(prof, emailMap[prof.email]));
        return;
      }

      unmatchedProfs.push(prof);
    });

    employees.forEach((employee) => {
      if (!employee.email || !matchedEmails[employee.email]) {
        unmatchedEmployes.push(employee);
      }
    });


    utils.log('Now matching by name');

    // Now try to match by name
    matchedEmails = {};
    const finalUnmatchedProfs = [];

    for (const ccisProf of unmatchedProfs) {
      const employee = this.findMatchByName(unmatchedEmployes, ccisProf);

      if (employee) {
        matchedPeople.push(this.mergePeople(ccisProf, employee));
        const index = unmatchedEmployes.indexOf(employee);
        unmatchedEmployes.splice(index, 1);
      } else {
        finalUnmatchedProfs.push(ccisProf);
      }
    }


    let phdStudentCount = 0;

    finalUnmatchedProfs.forEach((prof) => {
      if (prof.positions && prof.positions.length === 1 && prof.positions[0] === 'PhD Student') {
        phdStudentCount++;
      }
    });

    utils.log('Unable to match ', finalUnmatchedProfs.length, '/', ccis.length);
    utils.log(phdStudentCount, 'of the unmatched people are PhD students who are usually not in the employee directory.');


    const output = unmatchedEmployes.concat(finalUnmatchedProfs).concat(matchedPeople);

    utils.log(output.length, employees.length, ccis.length);

    // Swap the single email to an array to match with the people who were matched between ccis and employee
    for (let i = 0; i < output.length; i++) {
      const person = output[i];
      if (person.email) {
        if (person.emails) {
          console.warn('Person already has emails array???', person);
        }
        person.emails = [person.email];
        person.email = undefined;
      }
    }


    // Add IDs to people that don't have them (when only from the ccis directory)
    output.forEach((person, index) => {
      if (person.id) {
        return;
      }

      output[index].id = String(index) + String(Math.random()) + person.name;
    });


    // Save the file
    await mkdirp(macros.PUBLIC_DIR);
    await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employees.json'), JSON.stringify(output));


    // Create a map so the frontend is faster
    const employeeMap = {};
    output.forEach((person) => {
      if (employeeMap[person.id]) {
        utils.log('Error, duplicate id!', person.id);
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
    index.addField('email');
    index.addField('office');
    index.addField('primaryappointment');
    index.addField('primarydepartment');


    output.forEach((row) => {
      index.addDoc(row);
    });

    await fs.writeFile(path.join(macros.PUBLIC_DIR, 'employeesSearchIndex.json'), JSON.stringify(index.toJSON()));
    console.log('wrote employee json files');

    return output;
  }
}

const instance = new CombineCCISandEmployees();
export default instance;

if (require.main === module) {
  instance.main();
}
