import removeAccents from 'remove-accents';
import mkdirp from 'mkdirp-promise';
import elasticlunr from 'elasticlunr';

import fs from 'fs-promise';
import path from 'path';
import utils from './utils'
import macros from './macros';
import ccisFaculty from './neuCCISFaculty';
import neuEmployees from './neuEmployees';

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

class CombineCCISandEmployees {

  constructor(props) {

    this.couldNotFindNameList = {};
  }

  // Given a list of things, will find the first one that is longer than 1 letter (a-z)
  findName(list) {
    for (let i = 0; i < list.length; i++) {
      const noSymbols = list[i].toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');

      if (noSymbols.length > 1 && !['ii', 'iii', 'jr', 'sr', 'dr'].includes(noSymbols)) {
        return list[i];
      }
    }


    // Only log each warning once, just to not spam the console. This method is called a lot.
    const logMatchString = list.join('');
    if (this.couldNotFindNameList[logMatchString]) {
      return null;
    }
    this.couldNotFindNameList[logMatchString] = true;

    utils.log('Could not find name from list:', list);
    return null;
  }

  getFirstLastName(employeeObj) {
    const retVal = {};

    let name = employeeObj.name;

    if (name.match(/jr.?,/gi)) {
      name = name.replace(/, jr.?,/gi, ',');
    }

    if (utils.occurrences(name, ',') !== 1) {
      utils.log('Name has != commas', name);
      return null;
    }

    const splitOnComma = name.split(',');

    const beforeCommaSplit = splitOnComma[1].trim().split(' ');
    const firstName = this.findName(beforeCommaSplit);

    const afterCommaSplit = splitOnComma[0].trim().split(' ').reverse();
    const lastname = this.findName(afterCommaSplit);

    retVal.firstName = firstName;
    retVal.lastName = lastname;
    return retVal;
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


  async main() {
    const ccis = await ccisFaculty.main();
    const employees = await neuEmployees.go();

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

    return output;
  }
}

const instance = new CombineCCISandEmployees();
export default instance;

if (require.main === module) {
  instance.main();
}
