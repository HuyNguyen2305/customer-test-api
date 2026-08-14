import { formatDate } from '#common/pdf/pdf-kit.util.js';

describe('formatDate', () => {
  it('formats an ISO date string as MM/DD/YYYY', () => {
    expect(formatDate('2026-08-12T00:00:00.000Z')).toBe('08/12/2026');
  });

  it('pads single-digit month and day', () => {
    expect(formatDate('2026-01-05T00:00:00.000Z')).toBe('01/05/2026');
  });

  it('returns an empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('returns an empty string for an unparseable value instead of "Invalid Date"', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('formats a UTC-midnight timestamp using UTC (not local-time) components', () => {
    // A server running in any negative-UTC-offset timezone (e.g. the
    // Americas) would read a UTC-midnight Date's local getMonth()/getDate()
    // as the previous calendar day. formatDate must use UTC getters so the
    // rendered date doesn't depend on the deploying server's timezone.
    const realDate = Date;
    class SpoofedLocalTimezoneDate extends Date {
      getMonth() {
        return super.getUTCMonth() === 0 ? 11 : super.getUTCMonth() - 1;
      }

      getDate() {
        // Simulates a UTC-5 server: local time is 5 hours behind, rolling a
        // UTC-midnight timestamp back to the previous day.
        return super.getUTCDate() - 1 || 1;
      }

      getFullYear() {
        return super.getUTCFullYear();
      }
    }
    global.Date = SpoofedLocalTimezoneDate;

    try {
      expect(formatDate('2026-08-12T00:00:00.000Z')).toBe('08/12/2026');
    } finally {
      global.Date = realDate;
    }
  });
});
