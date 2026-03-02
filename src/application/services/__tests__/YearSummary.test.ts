import { describe, it, expect } from 'vitest';
import { computeYearSummary } from '../YearSummary';
import { ProcessPortfolioUseCase } from '../../usecases/ProcessPortfolioUseCase';
import { PortfolioCalculationService } from '../../../domain/services/PortfolioCalculationService';
import { PortfolioAnalyticsService } from '../../../domain/services/PortfolioAnalyticsService';
import { MockExchangeRateService } from '../../../infrastructure/services/MockExchangeRateService';
import { JSONOperationRepository } from '../../../infrastructure/repositories/JSONOperationRepository';

function makeUseCase(ops: string) {
  const opRepo = new JSONOperationRepository(ops);
  const exchangeService = new MockExchangeRateService(5.0);
  const calcService = new PortfolioCalculationService(exchangeService);
  const analyticsService = new PortfolioAnalyticsService();
  return new ProcessPortfolioUseCase(opRepo, calcService, analyticsService);
}

describe('computeYearSummary', () => {
  it('returns null for empty yearSnapshots', () => {
    expect(computeYearSummary(2023, [])).toBeNull();
  });

  it('returns summary for year with only vestings', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
    ]);
    const uc = makeUseCase(json);
    const { snapshots } = await uc.execute({});
    const summary = computeYearSummary(2023, snapshots);

    expect(summary).not.toBeNull();
    expect(summary!.year).toBe(2023);
    expect(summary!.totalOperations).toBe(1);
    expect(summary!.totalVested).toBe(100);
    expect(summary!.totalSold).toBe(0);
    expect(summary!.netChange).toBe(100);
    expect(summary!.initialQty).toBe(0);
    expect(summary!.finalQty).toBe(100);
    expect(summary!.vestingCount).toBe(1);
    expect(summary!.tradeCount).toBe(0);
    expect(summary!.irpfBensEDireitos).toContain('Participações em sociedades');
    expect(summary!.irpfLocalizacao).toBe('137 - Cayman, Ilhas');
    expect(summary!.irpfCodigoNegociacao).toBe('NU');
  });

  it('returns summary for year with vestings and trades', async () => {
    const json = JSON.stringify([
      { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
      { type: 'trade', date: '06/10/2023', quantity: 50, price: 15 },
    ]);
    const uc = makeUseCase(json);
    const { snapshots } = await uc.execute({});
    const summary = computeYearSummary(2023, snapshots);

    expect(summary).not.toBeNull();
    expect(summary!.year).toBe(2023);
    expect(summary!.totalOperations).toBe(2);
    expect(summary!.totalVested).toBe(100);
    expect(summary!.totalSold).toBe(50);
    expect(summary!.netChange).toBe(50);
    expect(summary!.initialQty).toBe(0);
    expect(summary!.finalQty).toBe(50);
    expect(summary!.vestingCount).toBe(1);
    expect(summary!.tradeCount).toBe(1);
    expect(summary!.totalSaleRevenue).toBeGreaterThanOrEqual(0);
    expect(summary!.totalCostBasis).toBeGreaterThanOrEqual(0);
    expect(summary!.irpfDiscriminacao).toContain('Nu Holdings');
    expect(summary!.irpfDiscriminacao).toContain('ETrade');
  });
});
