import { describe, it, expect } from 'vitest';
import { ProfitLoss } from '../core/ProfitLoss';

describe('ProfitLoss', () => {
  it('creates a profit value', () => {
    const pl = new ProfitLoss(1000, 'BRL');
    expect(pl.amount).toBe(1000);
    expect(pl.currency).toBe('BRL');
  });

  it('creates a loss (negative) value', () => {
    const pl = new ProfitLoss(-500, 'BRL');
    expect(pl.amount).toBe(-500);
  });

  it('creates a zero value', () => {
    const pl = new ProfitLoss(0, 'BRL');
    expect(pl.amount).toBe(0);
  });

  it('throws when currency is empty', () => {
    expect(() => new ProfitLoss(100, '')).toThrow('Currency is required');
  });

  describe('add', () => {
    it('adds two profit/loss values of the same currency', () => {
      const a = new ProfitLoss(300, 'BRL');
      const b = new ProfitLoss(-100, 'BRL');
      const result = a.add(b);
      expect(result.amount).toBe(200);
      expect(result.currency).toBe('BRL');
    });

    it('adds a profit to a loss resulting in positive', () => {
      const profit = new ProfitLoss(500, 'BRL');
      const loss = new ProfitLoss(-200, 'BRL');
      expect(profit.add(loss).amount).toBe(300);
    });

    it('throws when adding mismatched currencies', () => {
      const brl = new ProfitLoss(100, 'BRL');
      const usd = new ProfitLoss(100, 'USD');
      expect(() => brl.add(usd)).toThrow('Cannot add USD to BRL');
    });

    it('returns a new instance (immutable)', () => {
      const a = new ProfitLoss(100, 'BRL');
      const b = new ProfitLoss(50, 'BRL');
      const result = a.add(b);
      expect(result).not.toBe(a);
      expect(a.amount).toBe(100);
    });
  });

  describe('toString', () => {
    it('formats with 4 decimal places', () => {
      expect(new ProfitLoss(1234.5, 'BRL').toString()).toBe('1234.5000 BRL');
    });
  });
});
