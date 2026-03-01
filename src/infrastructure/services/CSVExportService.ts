import { PortfolioSnapshot } from '../../domain/entities';
import { IDataExportService } from '../../application/interfaces';
import { computeYearSummary } from '../../application/services';
import { PortfolioSnapshotSerializer } from '../adapters/PortfolioSnapshotSerializer';

/**
 * CSV Export Service
 *
 * Exports portfolio data to CSV format.
 * Generates two files:
 * 1. Portfolio history (all operations)
 * 2. Yearly summary (final position per year, with year-detail columns)
 */
export class CSVExportService implements IDataExportService {
  exportPortfolioData(snapshots: PortfolioSnapshot[]): void {
    const portfolioCSV = this.generatePortfolioHistoryCSV(snapshots);
    const yearlyCSV = this.generateYearlySummaryCSV(snapshots);

    this.downloadCSV(portfolioCSV, 'portfolio_history.csv');
    this.downloadCSV(yearlyCSV, 'yearly_summary.csv');
  }

  /**
   * Returns the yearly summary CSV content (for testing).
   */
  getYearlySummaryCSVContent(snapshots: PortfolioSnapshot[]): string {
    return this.generateYearlySummaryCSV(snapshots);
  }

  private generatePortfolioHistoryCSV(snapshots: PortfolioSnapshot[]): string {
    if (snapshots.length === 0) {
      return '';
    }

    const headers = PortfolioSnapshotSerializer.csvHeaders();
    const rows = snapshots.map((snapshot) => PortfolioSnapshotSerializer.toCSVRow(snapshot));

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateYearlySummaryCSV(snapshots: PortfolioSnapshot[]): string {
    const yearlySnapshots = this.getYearlySnapshots(snapshots);
    const snapshotsByYear = this.getSnapshotsByYear(snapshots);

    const headers = [
      'Ano',
      'Quantidade Final',
      'Custo Acumulado USD',
      'Preço Médio USD',
      'Custo Acumulado BRL',
      'Preço Médio BRL',
      'Ganho/Perda Total BRL',
      'Total de Operações',
      'Ações Recebidas (Vesting)',
      'Ações Vendidas',
      'Variação Líquida',
      'Valor das Vendas (BRL)',
      'Custo de Aquisição (BRL)',
      'Ganho/Perda de Capital',
      'Preço Médio Final (USD)',
      'Preço Médio Final (BRL)',
      'PTAX Média Venda',
      'Resumo para Imposto de Renda (valor 31/12)',
      'Bens e Direitos',
      'Localização (País)',
      'Discriminação',
      'Negociado em bolsa',
      'Código da Negociação',
      'Situação em 31/12',
      'Lucro ou Prejuízo',
    ];

    const rows = Array.from(yearlySnapshots.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, lastSnapshot]) => {
        const yearSnapshotsList = snapshotsByYear.get(year) ?? [lastSnapshot];
        const summary = computeYearSummary(year, yearSnapshotsList);

        const position = lastSnapshot.position;
        const baseRow = [
          year.toString(),
          position.quantity.value.toString(),
          position.totalCostUsd.amount.toFixed(4),
          position.averagePriceUsd.amount.toFixed(4),
          position.totalCostBrl.amount.toFixed(4),
          position.averagePriceBrl.amount.toFixed(4),
          position.grossProfitBrl.amount.toFixed(4),
        ];

        if (!summary) {
          const emptyCells = new Array(headers.length - baseRow.length).fill('');
          return [...baseRow, ...emptyCells];
        }

        return [
          ...baseRow,
          summary.totalOperations.toString(),
          summary.totalVested.toString(),
          summary.totalSold.toString(),
          summary.netChange.toString(),
          summary.totalSaleRevenue.toFixed(4),
          summary.totalCostBasis.toFixed(4),
          summary.totalProfitLoss.toFixed(4),
          summary.finalAvgPriceUsd.toFixed(4),
          summary.finalAvgPriceBrl.toFixed(4),
          summary.avgPtaxAsk.toFixed(4),
          summary.totalCostBrl.toFixed(4),
          summary.irpfBensEDireitos,
          summary.irpfLocalizacao,
          summary.irpfDiscriminacao,
          summary.irpfNegociadoEmBolsa,
          summary.irpfCodigoNegociacao,
          summary.irpfSituacao3112,
          summary.irpfLucroOuPrejuizo,
        ];
      });

    return this.arrayToCSV([headers, ...rows]);
  }

  private getSnapshotsByYear(snapshots: PortfolioSnapshot[]): Map<number, PortfolioSnapshot[]> {
    const byYear = new Map<number, PortfolioSnapshot[]>();
    for (const snapshot of snapshots) {
      const year = snapshot.position.lastUpdated.getFullYear();
      const list = byYear.get(year) ?? [];
      list.push(snapshot);
      byYear.set(year, list);
    }
    for (const list of byYear.values()) {
      list.sort((a, b) => a.position.lastUpdated.getTime() - b.position.lastUpdated.getTime());
    }
    return byYear;
  }

  private getYearlySnapshots(snapshots: PortfolioSnapshot[]): Map<number, PortfolioSnapshot> {
    const yearlyMap = new Map<number, PortfolioSnapshot>();

    for (const snapshot of snapshots) {
      const year = snapshot.position.lastUpdated.getFullYear();
      const existing = yearlyMap.get(year);

      if (!existing || snapshot.position.lastUpdated >= existing.position.lastUpdated) {
        yearlyMap.set(year, snapshot);
      }
    }

    return yearlyMap;
  }

  private arrayToCSV(data: string[][]): string {
    return data.map((row) => row.map((cell) => this.escapeCSVCell(cell)).join(',')).join('\n');
  }

  /**
   * Properly escape CSV cells according to RFC 4180
   * - Wrap in quotes if contains comma, quote, or newline
   * - Escape quotes by doubling them
   */
  private escapeCSVCell(cell: string): string {
    const needsQuoting = cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r');
    
    if (needsQuoting) {
      // Escape quotes by doubling them
      const escaped = cell.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    
    return cell;
  }

  private downloadCSV(csvContent: string, filename: string): void {
    // Add UTF-8 BOM for proper Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }
}
