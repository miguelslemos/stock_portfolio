import { describe, it, expect } from 'vitest';
import { CSVExportService } from '../CSVExportService';
import { ProcessPortfolioUseCase } from '../../../application/usecases/ProcessPortfolioUseCase';
import { PortfolioCalculationService } from '../../../domain/services/PortfolioCalculationService';
import { PortfolioAnalyticsService } from '../../../domain/services/PortfolioAnalyticsService';
import { MockExchangeRateService } from '../MockExchangeRateService';
import { JSONOperationRepository } from '../../repositories/JSONOperationRepository';

function makeSnapshots(ops: string) {
  const opRepo = new JSONOperationRepository(ops);
  const exchangeService = new MockExchangeRateService(5.0);
  const calcService = new PortfolioCalculationService(exchangeService);
  const analyticsService = new PortfolioAnalyticsService();
  const uc = new ProcessPortfolioUseCase(opRepo, calcService, analyticsService);
  return uc.execute({}).then((r) => r.snapshots);
}

describe('CSVExportService', () => {
  describe('getYearlySummaryCSVContent', () => {
    it('includes extended year-detail columns in header', async () => {
      const json = JSON.stringify([
        { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
      ]);
      const snapshots = await makeSnapshots(json);
      const service = new CSVExportService();
      const csv = service.getYearlySummaryCSVContent(snapshots);

      const headerLine = csv.split('\n')[0] ?? '';
      expect(headerLine).toContain('Total de Operações');
      expect(headerLine).toContain('Ações Recebidas (Vesting)');
      expect(headerLine).toContain('Ações Vendidas');
      expect(headerLine).toContain('Variação Líquida');
      expect(headerLine).toContain('Valor das Vendas (BRL)');
      expect(headerLine).toContain('Custo de Aquisição (BRL)');
      expect(headerLine).toContain('Ganho/Perda de Capital');
      expect(headerLine).toContain('PTAX Média Venda');
      expect(headerLine).toContain('Bens e Direitos');
      expect(headerLine).toContain('Discriminação');
    });

    it('outputs one data row per year with summary values', async () => {
      const json = JSON.stringify([
        { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 },
        { type: 'trade', date: '06/10/2023', quantity: 50, price: 15 },
      ]);
      const snapshots = await makeSnapshots(json);
      const service = new CSVExportService();
      const csv = service.getYearlySummaryCSVContent(snapshots);

      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines[0]).toContain('Ano');
      expect(lines[1]).toContain('2023');
      expect(lines[1]).toContain('2');
      expect(lines[1]).toContain('100');
      expect(lines[1]).toContain('50');
    });
  });
});
