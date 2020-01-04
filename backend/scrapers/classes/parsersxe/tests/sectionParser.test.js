import SectionParser from '../sectionParser';
import data from './data/sectionParser.data';

describe('sectionParser', () => {
  const chem2311Section = SectionParser.parseSectionFromSearchResult(data.chem2311);
  const cs2500Section = SectionParser.parseSectionFromSearchResult(data.cs2500);
  it('should match snapshot', () => {
    // Snapshot test gives full coverage, but other tests also exist to clearly spec things out
    expect(chem2311Section).toMatchSnapshot();
    expect(cs2500Section).toMatchSnapshot();
  });

  it('should detect Honors', () => {
    expect(chem2311Section.honors).toBeTruthy();
    expect(cs2500Section.honors).toBeFalsy();
  });

  it('should detect online', () => {
    expect(chem2311Section.online).toBeTruthy();
    expect(cs2500Section.online).toBeFalsy();
  });
});
