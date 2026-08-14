import { truncateId } from '#common/pdf/pdf-kit.util.js';

describe('truncateId', () => {
  it('returns the id unchanged when it is at or under the length limit', () => {
    expect(truncateId('12345678', 8)).toBe('12345678');
    expect(truncateId('short', 8)).toBe('short');
  });

  it('truncates and appends an ellipsis when the id exceeds the length limit', () => {
    expect(truncateId('11111111-2222-3333-4444-666666666666', 8)).toBe('11111111…');
  });

  it('defaults to a length of 8', () => {
    expect(truncateId('11111111-2222-3333-4444-666666666666')).toBe('11111111…');
  });

  it('returns an empty string for null/undefined/empty input', () => {
    expect(truncateId(null)).toBe('');
    expect(truncateId(undefined)).toBe('');
    expect(truncateId('')).toBe('');
  });
});
