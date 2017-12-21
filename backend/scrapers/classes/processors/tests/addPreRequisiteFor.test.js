/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import addPreRequisiteFor from '../addPreRequisiteFor';

describe('addPreRequisiteFor tests', () => {
  const cs2500 = {
    classId: '2500',
    termId: '201829',
    host: 'neu.edu',
  };

  const cs2510 = {
    prereqs: {
      type: 'or',
      values: [{
        subject: 'CS',
        classId: '2500',
      }],
    },
    coreqs: {
      type: 'or',
      values: [{
        subject: 'CS',
        classId: '2511',
      }],
    },
    classId: '2510',
    termId: '201830',
    subject: 'CS',
  };

  const fakeClass1 = {
    optPrereqsFor:
      {
        values: [
          {
            subject: 'CS',
            classId: '5',
          }, {
            subject: 'MATH',
            classId: '2',
          }, {
            subject: 'EECE',
            classId: '11',
          }, {
            subject: 'EECE',
            classId: '7',
          },
          {
            subject: 'MATH',
            classId: '3',
          },
        ],
      },
    classId: '2510',
    termId: '201830',
    subject: 'CS',
    host: 'neu.edu',
  };

  const fakeClass2 = {
    prereqsFor:
      {
        values: [
          {
            subject: 'CS',
            classId: '5',
          }, {
            subject: 'MATH',
            classId: '2',
          }, {
            subject: 'EECE',
            classId: '11',
          }, {
            subject: 'EECE',
            classId: '7',
          },
          {
            subject: 'MATH',
            classId: '3',
          },
        ],
      },
    classId: '2510',
    termId: '201830',
    subject: 'EECE',
    host: 'neu.edu',
  };

  const termDump = {
    classes: [cs2500, cs2510, fakeClass1],
    sections: [],
  };

  it('should load in termDump', () => {
    addPreRequisiteFor.termDump = termDump;
    expect(addPreRequisiteFor.termDump).toBe(termDump);
  });

  describe('parseClass tests', () => {
    const outputPreReqClass = cs2500;
    outputPreReqClass.prereqsFor = [];
    outputPreReqClass.prereqsFor.push(cs2510);
  });


  it('should sort some optPrereqsFor', () => {
    addPreRequisiteFor.termDump = termDump;

    addPreRequisiteFor.sortPreReqs(fakeClass1);

    expect(fakeClass1.optPrereqsFor).toMatchSnapshot();
  });


  it('should sort some prereqsFor', () => {
    addPreRequisiteFor.termDump = termDump;

    addPreRequisiteFor.sortPreReqs(fakeClass2);

    expect(fakeClass2.prereqsFor).toMatchSnapshot();
  });
});
