/* eslint-disable no-underscore-dangle */
import SubjectAbbreviationParser from '../subjectAbbreviationParser';

describe('subjectAbbreviationParser', () => {
  it('_processSubjectListResponse builds mapping', () => {
    const banner = [
      {
        code: 'ACCT',
        description: 'Accounting',
      },
      {
        code: 'AVM',
        description: 'Adv Manufacturing System - CPS',
      },
    ];
    const map = {
      Accounting: 'ACCT',
      'Adv Manufacturing System - CPS': 'AVM',
    };
    expect(SubjectAbbreviationParser._processSubjectListResponse(banner)).toEqual(map);
  });
});
