import { describe, it, expect, vi } from 'vitest';
import { PortfolioCalculationService } from '../PortfolioCalculationService';
import { type ExchangeRateService } from '../ExchangeRateService';
import { ExchangeRate, Money, StockQuantity } from '../../entities';
import { VestingOperation, TradeOperation } from '../../operations';

function createMockExchangeRateService(bidRate: number, askRate: number): ExchangeRateService {
  return {
    getRate: vi.fn().mockResolvedValue(
      new ExchangeRate('USD', 'BRL', new Date(), bidRate, askRate)
    ),
  };
}

describe('PortfolioCalculationService', () => {
  it('should execute a single vesting operation', async () => {
    const service = new PortfolioCalculationService(
      createMockExchangeRateService(5.0, 5.0)
    );

    const ops = [
      new VestingOperation(new Date('2023-02-15'), new StockQuantity(100), new Money(10, 'USD')),
    ];

    const { positions, results } = await service.executeOperations(ops);

    expect(positions).toHaveLength(1);
    expect(results).toHaveLength(1);
    expect(positions[0]!.quantity.value).toBe(100);
    expect(positions[0]!.totalCostUsd.amount).toBe(1000);
    expect(positions[0]!.totalCostBrl.amount).toBe(5000);
  });

  it('should execute multiple operations chronologically', async () => {
    const service = new PortfolioCalculationService(
      createMockExchangeRateService(5.0, 5.1)
    );

    const ops = [
      new VestingOperation(new Date('2023-01-01'), new StockQuantity(100), new Money(10, 'USD')),
      new VestingOperation(new Date('2023-06-01'), new StockQuantity(50), new Money(15, 'USD')),
      new TradeOperation(new Date('2023-12-01'), new StockQuantity(30), new Money(20, 'USD')),
    ];

    const { positions } = await service.executeOperations(ops);

    expect(positions).toHaveLength(3);
    expect(positions[0]!.quantity.value).toBe(100);
    expect(positions[1]!.quantity.value).toBe(150);
    expect(positions[2]!.quantity.value).toBe(120);
  });

  it('should reset gross profit at year boundary', async () => {
    const service = new PortfolioCalculationService(
      createMockExchangeRateService(5.0, 5.1)
    );

    const ops = [
      new VestingOperation(new Date('2023-01-01'), new StockQuantity(100), new Money(10, 'USD')),
      new TradeOperation(new Date('2023-06-01'), new StockQuantity(50), new Money(15, 'USD')),
      new VestingOperation(new Date('2024-01-15'), new StockQuantity(50), new Money(12, 'USD')),
    ];

    const { positions } = await service.executeOperations(ops);

    expect(positions[1]!.grossProfitBrl.amount).not.toBe(0);
    expect(positions[2]!.grossProfitBrl.amount).toBe(0);
  });

  it('should return empty arrays for no operations', async () => {
    const service = new PortfolioCalculationService(
      createMockExchangeRateService(5.0, 5.0)
    );

    const { positions, results } = await service.executeOperations([]);

    expect(positions).toHaveLength(0);
    expect(results).toHaveLength(0);
  });

  it('should sort operations by date regardless of input order', async () => {
    const service = new PortfolioCalculationService(
      createMockExchangeRateService(5.0, 5.0)
    );

    const ops = [
      new VestingOperation(new Date('2023-06-01'), new StockQuantity(50), new Money(15, 'USD')),
      new VestingOperation(new Date('2023-01-01'), new StockQuantity(100), new Money(10, 'USD')),
    ];

    const { positions } = await service.executeOperations(ops);

    expect(positions[0]!.quantity.value).toBe(100);
    expect(positions[1]!.quantity.value).toBe(150);
  });
});
