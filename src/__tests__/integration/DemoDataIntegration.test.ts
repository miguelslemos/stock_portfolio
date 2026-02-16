import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSONOperationRepository } from '@/infrastructure/repositories/JSONOperationRepository';
import { PortfolioCalculationService, PortfolioAnalyticsService } from '@/domain/services';
import { ProcessPortfolioUseCase } from '@/application/usecases/ProcessPortfolioUseCase';
import { ExchangeRate } from '@/domain/entities';
import { type ExchangeRateService } from '@/domain/services/ExchangeRateService';

/**
 * Integration test using the demo-data.json fixture.
 * Mocks only the BCB exchange rate service — everything else is real.
 * 
 * This test validates the full pipeline:
 * JSON → Repository → Operations → Calculation → Snapshots → Response
 */

const PTAX_MOCK: Record<string, { bid: number; ask: number }> = {
  '2023-02-15': { bid: 5.2237, ask: 5.2293 },
  '2023-06-20': { bid: 4.7924, ask: 4.7980 },
  '2023-10-10': { bid: 5.0856, ask: 5.0912 },
  '2024-01-02': { bid: 4.8942, ask: 4.8998 },
  '2024-02-23': { bid: 4.9770, ask: 4.9826 },
  '2024-04-01': { bid: 5.0154, ask: 5.0210 },
  '2024-05-21': { bid: 5.1098, ask: 5.1154 },
  '2024-07-01': { bid: 5.5885, ask: 5.5941 },
  '2024-08-14': { bid: 5.4741, ask: 5.4797 },
  '2024-08-15': { bid: 5.4653, ask: 5.4709 },
  '2024-08-21': { bid: 5.4812, ask: 5.4868 },
  '2024-08-30': { bid: 5.6340, ask: 5.6396 },
  '2024-10-01': { bid: 5.4478, ask: 5.4534 },
};

function createMockExchangeRateService(): ExchangeRateService {
  return {
    getRate: vi.fn().mockImplementation((_from: string, _to: string, date: Date) => {
      const key = date.toISOString().slice(0, 10);
      const rate = PTAX_MOCK[key];
      if (rate) {
        return Promise.resolve(new ExchangeRate('USD', 'BRL', date, rate.bid, rate.ask));
      }
      for (let d = 1; d <= 7; d++) {
        const fallbackDate = new Date(date);
        fallbackDate.setDate(fallbackDate.getDate() - d);
        const fallbackKey = fallbackDate.toISOString().slice(0, 10);
        const fallbackRate = PTAX_MOCK[fallbackKey];
        if (fallbackRate) {
          return Promise.resolve(new ExchangeRate('USD', 'BRL', fallbackDate, fallbackRate.bid, fallbackRate.ask));
        }
      }
      return Promise.resolve(null);
    }),
  };
}

describe('Demo Data Integration', () => {
  const demoJsonPath = resolve(__dirname, '../../../public/demo-data.json');
  const demoJson = readFileSync(demoJsonPath, 'utf-8');

  it('should process all 14 operations from demo data', async () => {
    const repository = new JSONOperationRepository(demoJson);
    const exchangeRateService = createMockExchangeRateService();
    const calculationService = new PortfolioCalculationService(exchangeRateService);
    const analyticsService = new PortfolioAnalyticsService();
    const useCase = new ProcessPortfolioUseCase(repository, calculationService, analyticsService);

    const response = await useCase.execute({});

    expect(response.totalOperations).toBe(14);
    expect(response.snapshots).toHaveLength(14);
  });

  it('should compute correct final position after all operations', async () => {
    const repository = new JSONOperationRepository(demoJson);
    const exchangeRateService = createMockExchangeRateService();
    const calculationService = new PortfolioCalculationService(exchangeRateService);
    const analyticsService = new PortfolioAnalyticsService();
    const useCase = new ProcessPortfolioUseCase(repository, calculationService, analyticsService);

    const response = await useCase.execute({});
    const final = response.finalPosition;

    // 7 vestings: 100+100+122+108+184+184+184 = 982
    // 7 trades: 430+41+50+50+50+50+50 = 721
    // Final: 982 - 721 = 261
    expect(final.quantity.value).toBe(261);
  });

  it('should have non-zero average prices for non-empty position', async () => {
    const repository = new JSONOperationRepository(demoJson);
    const exchangeRateService = createMockExchangeRateService();
    const calculationService = new PortfolioCalculationService(exchangeRateService);
    const analyticsService = new PortfolioAnalyticsService();
    const useCase = new ProcessPortfolioUseCase(repository, calculationService, analyticsService);

    const response = await useCase.execute({});
    const final = response.finalPosition;

    expect(final.averagePriceUsd.amount).toBeGreaterThan(0);
    expect(final.averagePriceBrl.amount).toBeGreaterThan(0);
    expect(final.totalCostBrl.amount).toBeGreaterThan(0);
  });

  it('should compute average price BRL from accumulated cost, not USD × PTAX', async () => {
    const repository = new JSONOperationRepository(demoJson);
    const exchangeRateService = createMockExchangeRateService();
    const calculationService = new PortfolioCalculationService(exchangeRateService);
    const analyticsService = new PortfolioAnalyticsService();
    const useCase = new ProcessPortfolioUseCase(repository, calculationService, analyticsService);

    const response = await useCase.execute({});
    const final = response.finalPosition;

    const expectedPmBrl = final.totalCostBrl.amount / final.quantity.value;
    expect(final.averagePriceBrl.amount).toBeCloseTo(expectedPmBrl, 6);
  });

  it('should have snapshots covering 2023 and 2024', async () => {
    const repository = new JSONOperationRepository(demoJson);
    const exchangeRateService = createMockExchangeRateService();
    const calculationService = new PortfolioCalculationService(exchangeRateService);
    const analyticsService = new PortfolioAnalyticsService();
    const useCase = new ProcessPortfolioUseCase(repository, calculationService, analyticsService);

    const response = await useCase.execute({});
    const years = new Set(response.snapshots.map(s => s.position.lastUpdated.getFullYear()));

    expect(years.has(2023)).toBe(true);
    expect(years.has(2024)).toBe(true);
  });
});
