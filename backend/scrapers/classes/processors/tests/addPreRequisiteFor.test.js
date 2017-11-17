/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import addPreRequisiteFor from '../addPreRequisiteFor';
// import Keys from '../../../../../common/Keys';

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
        classUid: '2500_699845913',
        classId: '2500',
      }],
    },
    coreqs: {
      type: 'or',
      values: [{
        subject: 'CS',
        classUid: '2511_803118792',
        classId: '2511',
      }],
    },
    classId: '2510',
    termId: '201830',
    subject: 'CS',
  };

  const termDump = {
    classes: [cs2500, cs2510],
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
});
