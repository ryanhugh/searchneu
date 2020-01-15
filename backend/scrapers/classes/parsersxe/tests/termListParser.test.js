import TermListParser from '../termListParser';

describe('termListParser', () => {
  it('pulls out relevant data', () => {
    const list = [
      {
        code: '202034',
        description: 'Spring 2020 CPS Semester',
      },
      {
        code: '202032',
        description: 'Spring 2020 Law Semester',
      },
      {
        code: '202030',
        description: 'Spring 2020 Semester',
      },
    ];
    expect(TermListParser.serializeTermsList(list)).toMatchSnapshot();
  });
});
