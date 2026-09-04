import { calculateExpectedPay, calculatePaidHours } from './dateUtils';

describe('shift pay calculations', () => {
  const start = '2026-09-04T09:00:00Z';
  const end = '2026-09-04T11:00:00Z';

  it('subtracts the break duration from paid hours', () => {
    expect(calculatePaidHours(start, end, 30)).toBe(1.5);
  });

  it('calculates expected hourly pay from paid hours', () => {
    expect(calculateExpectedPay(start, end, 30, 20)).toBe(30);
  });

  it('does not calculate expected pay for monthly workplaces', () => {
    expect(calculateExpectedPay(start, end, 30, 20, 'monthly')).toBe(0);
  });
});