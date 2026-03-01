import { describe, it, expect } from 'vitest';
import { PortfolioAnalyticsService } from '../PortfolioAnalyticsService';
import { PortfolioPosition } from '../../entities/portfolio/PortfolioPosition';
import { Money } from '../../entities/core/Money';
import { StockQuantity } from '../../entities/core/StockQuantity';
import { ProfitLoss } from '../../entities/core/ProfitLoss';
import { ExchangeRate } from '../../entities/core/ExchangeRate';

function makePosition(qty: number, profitBrl: number): PortfolioPosition {
  return new PortfolioPosition(
    new StockQuantity(qty),
    new Money(qty * 10, 'USD'),
    new Money(qty * 50, 'BRL'),
    new Money(10, 'USD'),
    new ProfitLoss(profitBrl, 'BRL'),
    new Date('2023-06-01')
  );
}

describe('PortfolioAnalyticsService', () => {
  const service = new PortfolioAnalyticsService();

  describe('calculateTotalReturnBrl', () => {
    it('returns 0 for empty positions array', () => {
      expect(service.calculateTotalReturnBrl([]).amount).toBe(0);
    });

    it('returns grossProfitBrl of the last position', () => {
      const positions = [
        makePosition(100, 0),
        makePosition(150, 300),
        makePosition(100, 560),
      ];
      expect(service.calculateTotalReturnBrl(positions).amount).toBe(560);
    });

    it('returns profit from single-element array', () => {
      const positions = [makePosition(100, 1000)];
      expect(service.calculateTotalReturnBrl(positions).amount).toBe(1000);
    });
  });

  describe('calculatePositionValueBrl', () => {
    it('returns 0 for empty position', () => {
      const empty = PortfolioPosition.createEmpty(new Date());
      const rate = ExchangeRate.fromPTAX(5.0, new Date());
      const result = service.calculatePositionValueBrl(empty, new Money(10, 'USD'), rate);
      expect(result.amount).toBe(0);
    });

    it('computes market value = qty × price × ptax', () => {
      const position = makePosition(100, 0);
      const rate = ExchangeRate.fromPTAX(5.0, new Date());
      const result = service.calculatePositionValueBrl(position, new Money(15, 'USD'), rate);
      expect(result.amount).toBe(7500); // 100 × 15 × 5
      expect(result.currency).toBe('BRL');
    });
  });

  describe('calculateUnrealizedGainLossBrl', () => {
    it('returns 0 for empty position', () => {
      const empty = PortfolioPosition.createEmpty(new Date());
      const rate = ExchangeRate.fromPTAX(5.0, new Date());
      const result = service.calculateUnrealizedGainLossBrl(empty, new Money(10, 'USD'), rate);
      expect(result.amount).toBe(0);
    });

    it('returns positive gain when current value exceeds cost', () => {
      // Position: 100 shares, totalCostBrl = 5000
      const position = makePosition(100, 0);
      const rate = ExchangeRate.fromPTAX(5.0, new Date());
      // Market value = 100 × 12 × 5 = 6000; cost = 5000 → gain = 1000
      const result = service.calculateUnrealizedGainLossBrl(position, new Money(12, 'USD'), rate);
      expect(result.amount).toBe(1000);
    });

    it('returns negative loss when current value is below cost', () => {
      const position = makePosition(100, 0);
      const rate = ExchangeRate.fromPTAX(5.0, new Date());
      // Market value = 100 × 8 × 5 = 4000; cost = 5000 → loss = -1000
      const result = service.calculateUnrealizedGainLossBrl(position, new Money(8, 'USD'), rate);
      expect(result.amount).toBe(-1000);
    });
  });
});
