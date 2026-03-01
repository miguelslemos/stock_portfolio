import { describe, it, expect } from 'vitest';
import { PortfolioSnapshot } from '../snapshots/PortfolioSnapshot';
import { PortfolioPosition } from '../portfolio/PortfolioPosition';
import { OperationMetadata } from '../operations/OperationMetadata';
import { Money } from '../core/Money';
import { StockQuantity } from '../core/StockQuantity';
import { ProfitLoss } from '../core/ProfitLoss';
import { ExchangeRate } from '../core/ExchangeRate';

function makePosition(qty = 100, profitBrl = 0): PortfolioPosition {
  return new PortfolioPosition(
    new StockQuantity(qty),
    new Money(1000, 'USD'),
    new Money(5000, 'BRL'),
    new Money(10, 'USD'),
    new ProfitLoss(profitBrl, 'BRL'),
    new Date('2023-06-01')
  );
}

function makeVestingMetadata(): OperationMetadata {
  const rate = ExchangeRate.fromPTAX(5.0, new Date('2023-06-01'));
  return new OperationMetadata(
    'vesting',
    new Date('2023-06-01'),
    new Date('2023-06-01'),
    new StockQuantity(100),
    new Money(10, 'USD'),
    { ptaxBid: rate.bidRate!, ptaxAsk: rate.askRate! }
  );
}

function makeTradeMetadata(): OperationMetadata {
  const rate = ExchangeRate.fromPTAX(5.1, new Date('2023-09-01'));
  return new OperationMetadata(
    'trade',
    new Date('2023-09-01'),
    new Date('2023-09-03'),
    new StockQuantity(50),
    new Money(12, 'USD'),
    { ptaxBid: rate.bidRate!, ptaxAsk: rate.askRate! },
    {
      saleRevenueUsd: new Money(600, 'USD'),
      saleRevenueBrl: new Money(3060, 'BRL'),
      costBasisUsd: new Money(500, 'USD'),
      costBasisBrl: new Money(2500, 'BRL'),
      profitLossBrl: new ProfitLoss(560, 'BRL'),
    }
  );
}

describe('PortfolioSnapshot', () => {
  describe('getOperationDescription', () => {
    it('describes a vesting with + sign', () => {
      const snapshot = new PortfolioSnapshot(makePosition(), makeVestingMetadata());
      expect(snapshot.getOperationDescription()).toBe('vesting (+100)');
    });

    it('describes a trade with - sign', () => {
      const snapshot = new PortfolioSnapshot(makePosition(50), makeTradeMetadata());
      expect(snapshot.getOperationDescription()).toBe('trade (-50)');
    });
  });

  describe('getOperationProfitLoss', () => {
    it('returns null for vesting operations', () => {
      const snapshot = new PortfolioSnapshot(makePosition(), makeVestingMetadata());
      expect(snapshot.getOperationProfitLoss()).toBeNull();
    });

    it('returns null when no previous position', () => {
      const snapshot = new PortfolioSnapshot(makePosition(50, 560), makeTradeMetadata());
      expect(snapshot.getOperationProfitLoss()).toBeNull();
    });

    it('returns profit/loss difference for trade with previous position', () => {
      const prev = makePosition(100, 0);
      const current = makePosition(50, 560);
      const snapshot = new PortfolioSnapshot(current, makeTradeMetadata(), prev);
      const pl = snapshot.getOperationProfitLoss();
      expect(pl).not.toBeNull();
      expect(pl!.amount).toBe(560);
      expect(pl!.currency).toBe('BRL');
    });

    it('returns negative profit/loss for a losing trade', () => {
      const prev = makePosition(100, 200);
      const current = makePosition(50, -100);
      const snapshot = new PortfolioSnapshot(current, makeTradeMetadata(), prev);
      const pl = snapshot.getOperationProfitLoss();
      expect(pl!.amount).toBe(-300);
    });
  });
});
