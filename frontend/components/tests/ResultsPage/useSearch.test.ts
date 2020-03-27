import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import useSearch from '../../ResultsPage/useSearch';
import testHook from '../testHook';

async function stall(stallTime = 3000) {
  await new Promise((resolve) => setTimeout(resolve, stallTime));
}

const fetchStuff = jest.fn(({ mult }, page) => {
  return _.range((page + 1) * 2).map((a) => a * mult);
});


describe('useSearch', () => {
  let search;
  let timings = [];
  async function asyncFetch(params, page) {
    if (timings.length > 0) {
      await stall(timings.pop());
    }
    return fetchStuff(params, page);
  }
  beforeEach(() => {
    fetchStuff.mockClear();
    testHook(() => {
      search = useSearch({ mult: 1 }, [], asyncFetch);
    });
  });

  it('initially loads page 0', () => {
    expect(search.results).toEqual([0, 1]);
  });

  it('initially sets ready to true', () => {
    expect(search.isReady).toEqual(true);
  });

  it('loads more', async () => {
    await act(async () => search.loadMore());
    expect(search.results).toEqual([0, 1, 2, 3]);
  });

  it('executes new search', async () => {
    await act(async () => search.doSearch({ mult:2 }));
    expect(search.results).toEqual([0, 2]);
  });

  it('resets page after new search', async () => {
    await act(async () => search.loadMore());
    expect(search.results).toEqual([0, 1, 2, 3]);
    await act(async () => search.doSearch({ mult: 2 }));
    expect(search.results).toEqual([0, 2]);
  });

  describe('race conditions', () => {
    it('does not load more if other load currently mid-flight', async () => {
      timings = [50];
      await act(async () => search.loadMore());
      await act(async () => search.loadMore());
      await stall(100);
      expect(search.results).toEqual([0, 1, 2, 3]);
      expect(fetchStuff.mock.calls).toEqual([[{ mult: 1 }, 0], [{ mult: 1 }, 1]]);
    });

    it('discards an old search result', async () => {
      timings = [50];
      await act(async () => { search.doSearch({ mult: 2 }); });
      await act(async () => { search.doSearch({ mult: 3 }); });
      await stall(100);
      // 2 comes after 3, but we discard it
      expect(search.results).toEqual([0, 3]);
      expect(fetchStuff.mock.calls).toEqual([[{ mult: 1 }, 0], [{ mult: 3 }, 0], [{ mult: 2 }, 0]]);
    });

    it('discards old load more results when search changes', async () => {
      timings = [50];
      await act(async () => { search.loadMore(); });
      await act(async () => { search.doSearch({ mult: 3 }); });
      await stall(100);
      // load more results come after, but we discard it
      expect(search.results).toEqual([0, 3]);
      expect(fetchStuff.mock.calls).toEqual([[{ mult: 1 }, 0], [{ mult: 3 }, 0], [{ mult: 1 }, 1]]);
    });
  });
});
