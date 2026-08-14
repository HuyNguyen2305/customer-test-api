import { formatCurrency } from '#common/pdf/pdf-kit.util.js';

describe('formatCurrency', () => {
  it('formats a positive number with two decimal places', () => {
    expect(formatCurrency(65)).toBe('$65.00');
  });

  it('formats a negative number with the sign before the dollar sign', () => {
    expect(formatCurrency(-5)).toBe('-$5.00');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(65.019)).toBe('$65.02');
  });

  it('treats null/undefined as 0', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('coerces a numeric string (as returned by Sequelize DECIMAL columns)', () => {
    expect(formatCurrency('130.50')).toBe('$130.50');
    expect(formatCurrency('-12.34')).toBe('-$12.34');
  });

  it('formats zero without a negative sign', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-0)).toBe('$0.00');
  });
});
