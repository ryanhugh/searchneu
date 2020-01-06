import PrereqParser from '../prereqParser';
import PrereqParserData from './data/prereqParser.data';
import SubjectAbbreviationParser from '../subjectAbbreviationParser';

jest.mock('../subjectAbbreviationParser');
const subjectAbbreviationTable = SubjectAbbreviationParser.getSubjectAbbreviations();

describe('prereqParser', () => {
  it('should parse corequisites', () => {
    const phys1161coreqs = PrereqParser.serializeCoreqs(PrereqParserData.coreqs.phys1161, subjectAbbreviationTable);
    const phys1161actual = {
      type: 'and',
      values: [
        { classId: '1162', subject: 'PHYS' },
        { classId: '1163', subject: 'PHYS' },
      ],
    };
    const hlth1201coreqs = PrereqParser.serializeCoreqs(PrereqParserData.coreqs.hlth1201, subjectAbbreviationTable);
    const hlth1201actual = {
      type: 'and',
      values: [
        { classId: '1200', subject: 'HLTH' },
      ],
    };
    expect(phys1161coreqs).toEqual(phys1161actual);
    expect(hlth1201coreqs).toEqual(hlth1201actual);
  });

  it('should parse prerequisites', () => {
    const prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.biol3405, subjectAbbreviationTable);
    const actual = {
      type: 'or',
      values: [
        { classId: '1103', subject: 'BIOL' },
        { classId: '1113', subject: 'BIOL' },
        { classId: '2297', subject: 'BIOL' },
        { classId: '2299', subject: 'BIOL' },
        { classId: '2290', subject: 'ENVR' },
        { classId: '2290', subject: 'EEMB' },
        { classId: '3458', subject: 'PSYC' }],
    };
    expect(prereqs).toEqual(actual);
  });

  it("shouldn't break if there are no prerequisites/corequisites", () => {
    const empty = {
      type: 'and',
      values: [],
    };
    expect(PrereqParser.serializeCoreqs(PrereqParserData.coreqs.biol3405)).toEqual(empty);
    expect(PrereqParser.serializePrereqs(PrereqParserData.prereqs.cs2500)).toEqual(empty);
  });


  it('should add "Graduate Admissions REQ" as a string', () => {
    const prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.biol5549, subjectAbbreviationTable);
    const actual = {
      type: 'or',
      values: [
        { subject: 'BIOL', classId: '2301' },
        'Graduate Admission',
      ],
    };
    expect(prereqs).toEqual(actual);
  });

  it('should handle parenthesized prerequisites', () => {
    const prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.chem5610, subjectAbbreviationTable);
    const actual = {
      type: 'or',
      values: [
        {
          type: 'and',
          values: [
            {
              type: 'or',
              values: [
                { classId: '2317', subject: 'CHEM' },
                { classId: '2313', subject: 'CHEM' },
              ],
            },
            {
              type: 'or',
              values: [
                { classId: '3401', subject: 'CHEM' },
                { classId: '3421', subject: 'CHEM' },
                { classId: '3431', subject: 'CHEM' },
              ],
            },
          ],
        },
        'Graduate Admission'],
    };
    expect(prereqs).toEqual(actual);
  });

  it('should handle parenthesized prerequisites 2', () => {
    const prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.cs4240, subjectAbbreviationTable);
    expect(prereqs).toMatchSnapshot();
  });

  it('should handle nested parenthesized prerequisites or "Graduate Admissions REQ"', () => {
    const cive2221prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.cive2221, subjectAbbreviationTable);
    const nrsg2220prereqs = PrereqParser.serializePrereqs(PrereqParserData.prereqs.nrsg2220, subjectAbbreviationTable);
    expect(cive2221prereqs).toMatchSnapshot();
    expect(nrsg2220prereqs).toMatchSnapshot();
  });
});
