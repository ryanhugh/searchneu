import SearchResultsParser from '../searchResultsParser';
import subjectAbbreviationTable from './data/subjectAbbreviationTable.json';
import PrereqExamples from './data/getSectionPrerequisites';
import CoreqExamples from './data/getCorequisites';

it('should parse corequisites', () => {
  const phys1161coreqs = SearchResultsParser.serializeCoreqs(CoreqExamples.phys1161, subjectAbbreviationTable);
  const phys1161actual = {
    type: 'and',
    values: [
      {classId: '1162', subject: 'PHYS'},
      {classId: '1163', subject: 'PHYS'},
    ],
  };
  const hlth1201coreqs = SearchResultsParser.serializeCoreqs(CoreqExamples.hlth1201, subjectAbbreviationTable);
  const hlth1201actual = {
    type: 'and',
    values: [
      {classId: '1200', subject: 'HLTH'},
    ],
  };
  expect(phys1161coreqs).toEqual(phys1161actual);
  expect(hlth1201coreqs).toEqual(hlth1201actual);
});

it('should parse prerequisites', () => {
  const prereqs = SearchResultsParser.serializePrereqs(PrereqExamples.biol3405, subjectAbbreviationTable);
  const actual = {
    "type": "or",
    "values": [
      {"classId": "1103", "subject": "BIOL"},
      {"classId": "1113", "subject": "BIOL"},
      {"classId": "2297", "subject": "BIOL"},
      {"classId": "2299", "subject": "BIOL"},
      {"classId": "2290", "subject": "ENVR"},
      {"classId": "2290", "subject": "EEMB"},
      {"classId": "3458", "subject": "PSYC"}],
  };
  expect(prereqs).toEqual(actual);
});

it("shouldn't break if there are no prerequisites/corequisites", () => {
  expect(SearchResultsParser.serializeCoreqs(CoreqExamples.biol3405)).toBeFalsy();
  expect(SearchResultsParser.serializePrereqs(PrereqExamples.cs2500)).toBeFalsy();
});


it('should add "Graduate Admissions REQ" as a string', () => {
  const prereqs = SearchResultsParser.serializePrereqs(PrereqExamples.biol5549, subjectAbbreviationTable);
  const actual = [
    {subject: 'BIOL', classId: '2301'},
    'Graduate Admission REQ',
  ];
  expect(prereqs.values).toEqual(expect.arrayContaining(actual));
});

it('should handle parenthesized prerequisites', () => {
  const prereqs = SearchResultsParser.serializePrereqs(PrereqExamples.chem5610, subjectAbbreviationTable);
  // TODO
  expect(true).toBe(false);
});

it('should handle nested parenthesized prerequisites or "Graduate Admissions REQ"', () => {
  const cive2221prereqs = SearchResultsParser.serializePrereqs(PrereqExamples.cive2221, subjectAbbreviationTable);
  const nrsg2220prereqs = SearchResultsParser.serializePrereqs(PrereqExamples.nrsg2220, subjectAbbreviationTable);
  // TODO
  expect(true).toBe(false);
});
