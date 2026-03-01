import { describe, it, expect, vi } from 'vitest';
import { ProcessPortfolioUseCase } from '../ProcessPortfolioUseCase';
import { PortfolioCalculationService } from '../../../domain/services/PortfolioCalculationService';
import { PortfolioAnalyticsService } from '../../../domain/services/PortfolioAnalyticsService';
import { MockExchangeRateService } from '../../../infrastructure/services/MockExchangeRateService';
import { JSONOperationRepository } from '../../../infrastructure/repositories/JSONOperationRepository';
import { type IDataExportService } from '../../interfaces';
import { type PortfolioSnapshot } from '../../../domain/entities';

function makeUseCase(ops: string, exportService?: IDataExportService) {
  const opRepo = new JSONOperationRepository(ops);
  const exchangeService = new MockExchangeRateService(5.0);
  const calcService = new PortfolioCalculationService(exchangeService);
  const analyticsService = new PortfolioAnalyticsService();
  return new ProcessPortfolioUseCase(opRepo, calcService, analyticsService, exportService);
}

const TWO_OPS = JSON.stringify([
  { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
  { type: 'trade',   date: '06/10/2023', quantity: 50,  price: 15 },
]);

const ONE_VESTING = JSON.stringify([
  { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
]);

describe('ProcessPortfolioUseCase', () => {
  it('returns empty response when no operations', async () => {
    const uc = makeUseCase('[]');
    const result = await uc.execute({});
    expect(result.totalOperations).toBe(0);
    expect(result.snapshots).toHaveLength(0);
    expect(result.finalPosition.quantity.value).toBe(0);
  });

  it('processes vesting and trade operations correctly', async () => {
    const uc = makeUseCase(TWO_OPS);
    const result = await uc.execute({});
    expect(result.totalOperations).toBe(2);
    expect(result.finalPosition.quantity.value).toBe(50); // 100 - 50
    expect(result.snapshots).toHaveLength(2);
  });

  it('returns snapshots with metadata for each operation', async () => {
    const uc = makeUseCase(TWO_OPS);
    const { snapshots } = await uc.execute({});
    expect(snapshots[0]!.metadata.operationType).toBe('vesting');
    expect(snapshots[1]!.metadata.operationType).toBe('trade');
  });

  it('calls exportPortfolioData when exportData=true and exportService provided', async () => {
    const exportSpy = vi.fn();
    const exportService: IDataExportService = {
      exportPortfolioData: exportSpy,
    };
    const uc = makeUseCase(ONE_VESTING, exportService);
    await uc.execute({ exportData: true });
    expect(exportSpy).toHaveBeenCalledOnce();
    const snapshots = exportSpy.mock.calls[0]![0] as PortfolioSnapshot[];
    expect(snapshots).toHaveLength(1);
  });

  it('does NOT call exportPortfolioData when exportData=false', async () => {
    const exportSpy = vi.fn();
    const exportService: IDataExportService = { exportPortfolioData: exportSpy };
    const uc = makeUseCase(ONE_VESTING, exportService);
    await uc.execute({ exportData: false });
    expect(exportSpy).not.toHaveBeenCalled();
  });

  it('does NOT call exportPortfolioData when no exportService provided', async () => {
    const uc = makeUseCase(ONE_VESTING);
    await expect(uc.execute({ exportData: true })).resolves.not.toThrow();
  });
});
