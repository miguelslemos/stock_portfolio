import { describe, it, expect } from 'vitest';
import { PortfolioPosition } from '../portfolio/PortfolioPosition';
import { Money } from '../core/Money';
import { StockQuantity } from '../core/StockQuantity';
import { ProfitLoss } from '../core/ProfitLoss';

function makePosition(overrides?: Partial<{
  qty: number;
  costUsd: number;
  costBrl: number;
  avgUsd: number;
  profit: number;
}>): PortfolioPosition {
  const qty = overrides?.qty ?? 100;
  const costUsd = overrides?.costUsd ?? 1000;
  const costBrl = overrides?.costBrl ?? 5000;
  const avgUsd = overrides?.avgUsd ?? 10;
  const profit = overrides?.profit ?? 0;
  return new PortfolioPosition(
    new StockQuantity(qty),
    new Money(costUsd, 'USD'),
    new Money(costBrl, 'BRL'),
    new Money(avgUsd, 'USD'),
    new ProfitLoss(profit, 'BRL'),
    new Date('2023-06-01')
  );
}

describe('PortfolioPosition', () => {
  describe('construction guards', () => {
    it('throws when totalCostUsd is not USD', () => {
      expect(() =>
        new PortfolioPosition(
          new StockQuantity(100),
          new Money(100, 'BRL'),
          new Money(500, 'BRL'),
          new Money(1, 'USD'),
          new ProfitLoss(0, 'BRL'),
          new Date()
        )
      ).toThrow('Total cost USD must be in USD currency');
    });

    it('throws when totalCostBrl is not BRL', () => {
      expect(() =>
        new PortfolioPosition(
          new StockQuantity(100),
          new Money(100, 'USD'),
          new Money(500, 'USD'),
          new Money(1, 'USD'),
          new ProfitLoss(0, 'BRL'),
          new Date()
        )
      ).toThrow('Total cost BRL must be in BRL currency');
    });
  });

  describe('createEmpty', () => {
    it('creates an empty position with zero values', () => {
      const date = new Date('2023-01-01');
      const pos = PortfolioPosition.createEmpty(date);
      expect(pos.quantity.value).toBe(0);
      expect(pos.totalCostUsd.amount).toBe(0);
      expect(pos.totalCostBrl.amount).toBe(0);
      expect(pos.averagePriceUsd.amount).toBe(0);
      expect(pos.grossProfitBrl.amount).toBe(0);
      expect(pos.lastUpdated).toBe(date);
    });

    it('isEmpty returns true for empty position', () => {
      expect(PortfolioPosition.createEmpty(new Date()).isEmpty).toBe(true);
    });

    it('isEmpty returns false for non-empty position', () => {
      expect(makePosition().isEmpty).toBe(false);
    });
  });

  describe('averagePriceBrl', () => {
    it('computes BRL average price as totalCostBrl / quantity', () => {
      const pos = makePosition({ qty: 100, costBrl: 5000 });
      expect(pos.averagePriceBrl.amount).toBe(50);
      expect(pos.averagePriceBrl.currency).toBe('BRL');
    });

    it('returns 0 for empty position', () => {
      const pos = makePosition({ qty: 0, costBrl: 0 });
      expect(pos.averagePriceBrl.amount).toBe(0);
    });

    it('caches the computed value (same reference on repeated calls)', () => {
      const pos = makePosition();
      const first = pos.averagePriceBrl;
      const second = pos.averagePriceBrl;
      expect(first).toBe(second);
    });
  });

  describe('calculateAveragePrice', () => {
    it('calculates USD average price', () => {
      const pos = makePosition({ qty: 100, costUsd: 1500 });
      expect(pos.calculateAveragePrice('USD').amount).toBe(15);
    });

    it('calculates BRL average price', () => {
      const pos = makePosition({ qty: 50, costBrl: 2500 });
      expect(pos.calculateAveragePrice('BRL').amount).toBe(50);
    });

    it('returns zero for empty position in any currency', () => {
      const empty = PortfolioPosition.createEmpty(new Date());
      expect(empty.calculateAveragePrice('USD').amount).toBe(0);
      expect(empty.calculateAveragePrice('BRL').amount).toBe(0);
    });

    it('throws for unsupported currency', () => {
      const pos = makePosition();
      expect(() => pos.calculateAveragePrice('EUR')).toThrow('Unsupported currency: EUR');
    });
  });

  describe('resetGrossProfitForNewYear', () => {
    it('creates new position with profit reset to zero', () => {
      const pos = makePosition({ profit: 1500 });
      const reset = pos.resetGrossProfitForNewYear();
      expect(reset.grossProfitBrl.amount).toBe(0);
      expect(reset.quantity.value).toBe(pos.quantity.value);
      expect(reset.totalCostBrl.amount).toBe(pos.totalCostBrl.amount);
    });

    it('does not mutate the original', () => {
      const pos = makePosition({ profit: 1500 });
      pos.resetGrossProfitForNewYear();
      expect(pos.grossProfitBrl.amount).toBe(1500);
    });
  });
});
