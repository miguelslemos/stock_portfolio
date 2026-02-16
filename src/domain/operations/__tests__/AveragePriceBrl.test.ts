import { describe, it, expect } from 'vitest';
import { VestingOperation } from '../VestingOperation';
import {
  Money,
  StockQuantity,
  ExchangeRate,
  PortfolioPosition,
} from '../../entities';

/**
 * Test for the correct average price BRL calculation.
 *
 * The average price in BRL must be computed as:
 *   PM BRL = Total Cost BRL / Total Quantity
 *
 * Where Total Cost BRL accumulates each purchase converted at that day's
 * PTAX rate — NOT as "PM USD × current PTAX".
 *
 * Mocked data:
 * | Date       | Qty | PTAX Compra | Price USD  | PM USD after |
 * |------------|-----|-------------|------------|--------------|
 * | 15/02/2023 | 100 | 5.2237      | 6.500000   | 6.500000     |
 * | 20/06/2023 | 100 | 4.7924      | 4.431929   | 5.465965     |
 * | 10/10/2023 | 122 | 5.0856      | 9.646779   | 7.050000     |
 */
describe('Average Price BRL — accumulated cost method', () => {
  const emptyPosition = PortfolioPosition.createEmpty(new Date('2023-01-01'));

  // ---------- 1st vesting: 15/02/2023 ----------
  // Cost USD = 100 × 6.50 = 650.00
  // Cost BRL = 650.00 × 5.2237 = 3,395.405
  const vesting1 = new VestingOperation(
    new Date('2023-02-15'),
    new StockQuantity(100),
    new Money(6.5, 'USD'),
    new Date('2023-02-15'),
  );
  const ptax1 = new ExchangeRate('USD', 'BRL', new Date('2023-02-15'), 5.2237, 5.2237);

  // ---------- 2nd vesting: 20/06/2023 ----------
  // Cost USD = 100 × 4.431929 = 443.1929
  // Cost BRL = 443.1929 × 4.7924 = 2,123.957654
  const vesting2 = new VestingOperation(
    new Date('2023-06-20'),
    new StockQuantity(100),
    new Money(4.431929, 'USD'),
    new Date('2023-06-20'),
  );
  const ptax2 = new ExchangeRate('USD', 'BRL', new Date('2023-06-20'), 4.7924, 4.7924);

  // ---------- 3rd vesting: 10/10/2023 ----------
  // Cost USD = 122 × 9.646779 = 1,176.907038
  // Cost BRL = 1,176.907038 × 5.0856 = 5,985.278432
  const vesting3 = new VestingOperation(
    new Date('2023-10-10'),
    new StockQuantity(122),
    new Money(9.646779, 'USD'),
    new Date('2023-10-10'),
  );
  const ptax3 = new ExchangeRate('USD', 'BRL', new Date('2023-10-10'), 5.0856, 5.0856);

  it('should compute PM BRL correctly after 1st vesting', () => {
    const result = vesting1.execute(emptyPosition, ptax1);
    const pos = result.position;

    expect(pos.quantity.value).toBe(100);
    expect(pos.totalCostUsd.amount).toBeCloseTo(650.0, 4);
    expect(pos.totalCostBrl.amount).toBeCloseTo(3395.405, 4);
    expect(pos.averagePriceUsd.amount).toBeCloseTo(6.5, 6);

    // PM BRL = 3,395.405 / 100 = 33.95405
    expect(pos.averagePriceBrl.amount).toBeCloseTo(33.95405, 4);
  });

  it('should compute PM BRL correctly after 2nd vesting (different PTAX)', () => {
    const after1 = vesting1.execute(emptyPosition, ptax1);
    const result = vesting2.execute(after1.position, ptax2);
    const pos = result.position;

    expect(pos.quantity.value).toBe(200);

    // Total cost USD = 650 + 443.1929 = 1,093.1929
    expect(pos.totalCostUsd.amount).toBeCloseTo(1093.1929, 4);

    // Total cost BRL = 3,395.405 + 2,123.957654 = 5,519.362654
    expect(pos.totalCostBrl.amount).toBeCloseTo(5519.3627, 2);

    // PM USD = 1,093.1929 / 200 = 5.465965
    expect(pos.averagePriceUsd.amount).toBeCloseTo(5.465965, 4);

    // PM BRL = 5,519.362654 / 200 = 27.596813
    // This is the critical assertion: PM BRL comes from accumulated cost,
    // NOT from PM USD × last PTAX (which would give 5.465965 × 4.7924 ≈ 26.19)
    expect(pos.averagePriceBrl.amount).toBeCloseTo(27.5968, 2);
  });

  it('should compute PM BRL correctly after 3rd vesting', () => {
    const after1 = vesting1.execute(emptyPosition, ptax1);
    const after2 = vesting2.execute(after1.position, ptax2);
    const result = vesting3.execute(after2.position, ptax3);
    const pos = result.position;

    expect(pos.quantity.value).toBe(322);

    // Total cost USD = 1,093.1929 + 1,176.907038 = 2,270.099938
    expect(pos.totalCostUsd.amount).toBeCloseTo(2270.0999, 2);

    // Total cost BRL = 5,519.362654 + 5,985.278432 = 11,504.641086
    expect(pos.totalCostBrl.amount).toBeCloseTo(11504.641, 0);

    // PM USD ≈ 7.050000
    expect(pos.averagePriceUsd.amount).toBeCloseTo(7.05, 2);

    // PM BRL = 11,504.641086 / 322 ≈ 35.7288
    expect(pos.averagePriceBrl.amount).toBeCloseTo(35.7287, 2);
  });

  it('should NOT equal the wrong formula (PM USD × PTAX)', () => {
    const after1 = vesting1.execute(emptyPosition, ptax1);
    const result = vesting2.execute(after1.position, ptax2);
    const pos = result.position;

    // The OLD (buggy) formula: PM USD × last PTAX bid
    const wrongPmBrl = pos.averagePriceUsd.amount * 4.7924;

    // The CORRECT formula: totalCostBrl / qty
    const correctPmBrl = pos.averagePriceBrl.amount;

    // Wrong ≈ 26.19, Correct ≈ 27.60 — they are significantly different
    expect(correctPmBrl).not.toBeCloseTo(wrongPmBrl, 0);
    expect(correctPmBrl).toBeCloseTo(27.5968, 2);
    expect(wrongPmBrl).toBeCloseTo(26.1943, 2);
  });

  it('should return zero PM BRL for empty position', () => {
    expect(emptyPosition.averagePriceBrl.amount).toBe(0);
    expect(emptyPosition.averagePriceBrl.currency).toBe('BRL');
  });
});
