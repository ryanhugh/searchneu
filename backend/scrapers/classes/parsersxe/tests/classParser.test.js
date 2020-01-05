import ClassParser from '../classParser';
import data from './data/classParser.data';

const simplePrereq = { type: 'and', values: [{ subject: 'CS', classId: '1800' }] };

beforeAll(() => {
  jest.spyOn(Date, 'now').mockReturnValue(1578252414987);
  jest.spyOn(ClassParser, 'getDescription').mockReturnValue('class description 123');
  jest.spyOn(ClassParser, 'getPrereqs').mockReturnValue(simplePrereq);
  jest.spyOn(ClassParser, 'getCoreqs').mockReturnValue(simplePrereq);
  jest.spyOn(ClassParser, 'getAttributes').mockReturnValue(['innovation', 'bizz']);
});

afterAll(() => {
  jest.restoreAllMocks();
});

jest.mock('../subjectAbbreviationParser');

describe('classParser', () => {
  describe('serializeAttributes', () => {
    it('trims and splits on <br/>', () => {
      const actual = ['Business Admin  UBBA'];
      expect(ClassParser.serializeAttributes(data.getCourseAttributes1)).toEqual(actual);
    });

    it('handles encoded html characters', () => {
      const actual = ['NUpath Natural/Designed World  NCND', 'NU Core Science/Tech Lvl 1  NCT1', 'Computer&Info Sci  UBCS'];
      expect(ClassParser.serializeAttributes(data.getCourseAttributes2)).toEqual(actual);
    });
  });

  describe('parseClassFromSearchResult', () => {
    it('parses and sends extra requests', async () => {
      expect(await ClassParser.parseClassFromSearchResult(data.chem2311, 202010)).toMatchSnapshot();
      expect(await ClassParser.parseClassFromSearchResult(data.cs2500, 202010)).toMatchSnapshot();
    });
  });
});
