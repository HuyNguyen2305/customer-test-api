import { computeNextOccurrences } from '#service/recurrence/recurrence-rule.util.js';

describe('computeNextOccurrences', () => {
  it('returns an empty array when repeatType is off', () => {
    const result = computeNextOccurrences(
      { repeatType: 'off' },
      { anchorDate: new Date('2026-01-01'), windowStart: new Date('2026-01-01'), windowEnd: new Date('2026-02-01') },
    );
    expect(result).toEqual([]);
  });

  it('returns an empty array when repeatType is does_not_repeat', () => {
    const result = computeNextOccurrences(
      { repeatType: 'does_not_repeat' },
      { anchorDate: new Date('2026-01-01'), windowStart: new Date('2026-01-01'), windowEnd: new Date('2026-02-01') },
    );
    expect(result).toEqual([]);
  });

  it('generates daily occurrences at the given interval within the window', () => {
    const result = computeNextOccurrences(
      { repeatType: 'daily', interval: 2 },
      { anchorDate: new Date('2026-01-01'), windowStart: new Date('2026-01-01'), windowEnd: new Date('2026-01-08') },
    );
    expect(result.map((d) => d.toISOString().slice(0, 10))).toEqual(['2026-01-03', '2026-01-05', '2026-01-07']);
  });

  it('generates weekly occurrences on specified weekdays', () => {
    const result = computeNextOccurrences(
      { repeatType: 'weekly', interval: 1, weeklyDays: ['monday'], weeklyPeriodType: 'every' },
      { anchorDate: new Date('2026-01-05'), windowStart: new Date('2026-01-05'), windowEnd: new Date('2026-01-26') },
    );
    expect(result.map((d) => d.getDay())).toEqual(result.map(() => 1));
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes a same-week later weekday, not just the following week', () => {
    // Monday 2026-01-05, rule fires Monday and Wednesday every week.
    const anchorDate = new Date('2026-01-05T10:00:00Z');
    const windowEnd = new Date('2026-01-20T00:00:00Z');

    const result = computeNextOccurrences(
      { repeatType: 'weekly', interval: 1, weeklyDays: ['monday', 'wednesday'] },
      { anchorDate, windowStart: anchorDate, windowEnd },
    );

    const dates = result.map((d) => d.toISOString().slice(0, 10));

    // The same week's Wednesday (2026-01-07) must not be skipped.
    expect(dates).toContain('2026-01-07');
    expect(dates).toEqual(['2026-01-07', '2026-01-12', '2026-01-14', '2026-01-19']);
  });

  it('still advances by the full interval for subsequent weeks when interval > 1', () => {
    // Monday 2026-01-05, rule fires every 2 weeks on Monday.
    const anchorDate = new Date('2026-01-05T10:00:00Z');
    const windowEnd = new Date('2026-02-10T00:00:00Z');

    const result = computeNextOccurrences(
      { repeatType: 'weekly', interval: 2, weeklyDays: ['monday'] },
      { anchorDate, windowStart: anchorDate, windowEnd },
    );

    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2026-01-19', '2026-02-02']);
  });

  it('generates monthly occurrences on the same day of month', () => {
    const result = computeNextOccurrences(
      { repeatType: 'monthly', interval: 1, repeatBy: 'day_of_month' },
      { anchorDate: new Date('2026-01-15'), windowStart: new Date('2026-01-15'), windowEnd: new Date('2026-04-01') },
    );
    expect(result.map((d) => d.getDate())).toEqual([15, 15]);
  });

  it('generates yearly occurrences on the same month/day', () => {
    const result = computeNextOccurrences(
      { repeatType: 'yearly', interval: 1 },
      { anchorDate: new Date('2026-01-15'), windowStart: new Date('2026-01-15'), windowEnd: new Date('2029-01-01') },
    );
    expect(result.map((d) => d.getFullYear())).toEqual([2027, 2028]);
  });

  it('stops generating once endsCount occurrences (from the anchor) have been reached', () => {
    const result = computeNextOccurrences(
      { repeatType: 'daily', interval: 1, endsType: 'after', endsCount: 2 },
      { anchorDate: new Date('2026-01-01'), windowStart: new Date('2026-01-01'), windowEnd: new Date('2026-02-01') },
    );
    expect(result).toHaveLength(2);
  });

  it('stops generating once endsDate is passed', () => {
    const result = computeNextOccurrences(
      { repeatType: 'daily', interval: 1, endsType: 'on_date', endsDate: '2026-01-03' },
      { anchorDate: new Date('2026-01-01'), windowStart: new Date('2026-01-01'), windowEnd: new Date('2026-02-01') },
    );
    expect(result.map((d) => d.toISOString().slice(0, 10))).toEqual(['2026-01-02', '2026-01-03']);
  });

  it('excludes candidates falling in an excepted month', () => {
    const result = computeNextOccurrences(
      { repeatType: 'monthly', interval: 1, repeatBy: 'day_of_month', exceptType: 'month', exceptMonths: ['march'] },
      { anchorDate: new Date('2026-01-15'), windowStart: new Date('2026-01-15'), windowEnd: new Date('2026-04-01') },
    );
    expect(result.some((d) => d.getMonth() === 2)).toBe(false);
  });
});
