import removeAccents from 'remove-accents';

import ccisFaculty from './neuCCISFaculty'
import neuEmployees from './neuEmployees'


// plan for merging the objects with the employee database
// 1. compare phone numbers. if any match, merge objects and remove from original lists
// 2. compare emails. if any match, merge objects and remove from original lists
// 3. if email.endswith husky.neu.edu in ccis site don't bother comparing
// 4. compare names and position...


// test changing northeastern.edu <-> neu.edu

// Names on the output from this file are "bob smith" and not "smith, bob", even if there was no match


// http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
function occurrences(string, subString, allowOverlapping) {
  string += '';
  subString += '';
  if (subString.length <= 0) {
    return (string.length + 1)
  };

  let n = 0;
  let pos = 0;
  const step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    }
    else {
      break;
    }
  }
  return n;
}

function wlog(...args) {
  let arr = [].slice.call(args);
  arr = ['Warning: '].concat(arr);
  console.log.apply(console.log, arr);
}

var couldNotFindNameList = {}

// Given a list of things, will find the first one that is longer than 1 letter (a-z)
function findName(list) {
  for (let i = 0; i < list.length; i++) {
    const noSymbols = list[i].toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');

    if (noSymbols.length > 1 && !['ii', 'iii', 'jr', 'sr', 'dr'].includes(noSymbols)) {
      return list[i];
    }
  }


  // Only log each warning once, just to not spam the console. This method is called a lot. 
  var logMatchString = list.join('')
  if (couldNotFindNameList[logMatchString]) {
    return;
  }
  couldNotFindNameList[logMatchString] = true

  console.log('Could not find name from list:', list);
  return null;
}

function getFirstLastName(employeeObj) {
  var retVal = {}

  var name = employeeObj.name

  if (name.match(/jr.?,/gi)) {
    name = name.replace(/, jr.?,/gi, ',');
  }

  if (occurrences(name, ',') !== 1) {
    wlog('Name has != commas', name);
    return;
  }

  const splitOnComma = name.split(',');

  const beforeCommaSplit = splitOnComma[1].trim().split(' ');
  const firstName = findName(beforeCommaSplit);

  const afterCommaSplit = splitOnComma[0].trim().split(' ').reverse();
  const lastname = findName(afterCommaSplit);

  retVal.firstName = firstName;
  retVal.lastName = lastname;
  return retVal;
}

function mergePeople(ccisProf, employee) {
  console.log('going to merge ', ccisProf.name, 'and ', employee.name)

  var output = {}

  console.log(ccisProf, employee)


  // Name is taken from the ccis profile because it is better data source. 
  // For people with multiple middle names and such, it seems to include just the importiant ones. 

  Object.assign(output, employee, ccisProf)

  console.log(output)


  process.exit()

}

function findMatchByName(employees, ccisProf) {
  for (const employee of employees) {
    const ccisCompareName = removeAccents(ccisProf.name);

    var {
      firstName,
      lastName
    } = getFirstLastName(employee)

    // It would be better to split each name into first name and last name
    // And compare those individually
    // But a good chunk of names would fail if we did that instead of just a .includes
    // eg. going to merge  [Panagiotos (Pete) Manolios](ccis) and  [Manolios, Pete](employee)
    if (ccisCompareName.includes(firstName) && ccisCompareName.includes(lastName)) {
      return employee
    }
  }
  return null
}


async function main() {

  var promises = []

  var ccis = await ccisFaculty.go()
  var employees = await neuEmployees.go()

  const mergedData = {}
  const emailMap = {};
  employees.forEach((employee) => {
    if (employee.email) {
      if (employee.email.endsWith('@neu.edu')) {
        employee.email = `${employee.email.split('@')[0]}@northeastern.edu`;
      }

      emailMap[employee.email] = employee;
    }
  });

  const unmatchedProfs = [];

  ccis.forEach((prof) => {

    // For some reason, some different people can have the same phone number. Cannot match by phone number

    if (prof.email && prof.email.endsWith('@neu.edu')) {
      prof.email = `${prof.email.split('@')[0]}@northeastern.edu`;
    }


    if (prof.email && emailMap[prof.email]) {
      mergePeople(prof, emailMap[prof.email])
      return;
    }

    unmatchedProfs.push(prof);
  });

  console.log('halfway done')


  const finalUnmatchedProfs = [];

  for (const ccisProf of unmatchedProfs) {
    let found = false;


    var employee = findMatchByName(employees, ccisProf)

    if (employee) {
      mergePeople(ccisProf, employee)
    }
    else {
      finalUnmatchedProfs.push(ccisProf)
    }
  }


  let phdStudentCount = 0;

  finalUnmatchedProfs.forEach((a) => {
    if (a.positions && a.positions.length === 1 && a.positions[0] === 'PhD Student') {
      phdStudentCount++;
      return;
    }

  });

  console.log('Unable to match ', finalUnmatchedProfs.length, '/', ccis.length)


  console.log(finalUnmatchedProfs.length, phdStudentCount);

}


if (require.main === module) {
  main();
}
