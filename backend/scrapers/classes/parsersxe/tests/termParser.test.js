import _ from 'lodash';
import TermParser from '../termParser';

describe('termParser', () => {
  // not worth testing parseTerm as it just maps other parsers over the results of requests
  // not worth testing requestsClassesForTerm and requestsSectionsForTerm as they just call concatpagination

  describe('concatPagination', () => {
    const mockReq = jest.fn();
    // Mock implementation just returns slices of the range [0,4]
    mockReq.mockImplementation((offset, pageSize) => {
      return {
        items: _.range(offset, Math.min(5, offset + pageSize)),
        totalCount: 5,
      };
    });
    afterEach(() => {
      mockReq.mockClear();
    });

    it('should call the callback with appropriate args', async () => {
      await TermParser.concatPagination(mockReq, 10);
      expect(mockReq.mock.calls).toEqual([[0, 1], [0, 10]]);
    });

    it('should default to asking for 500 items', async () => {
      const data = await TermParser.concatPagination(mockReq);
      expect(data).toEqual([0, 1, 2, 3, 4]);
      expect(mockReq.mock.calls).toEqual([[0, 1], [0, 500]]);
    });

    it('should make multiple requests and stitch together', async () => {
      const data = await TermParser.concatPagination(mockReq, 2);
      expect(data).toEqual([0, 1, 2, 3, 4]);
      expect(mockReq.mock.calls).toEqual([[0, 1], [0, 2], [2, 2], [4, 2]]);
    });
  });
});
