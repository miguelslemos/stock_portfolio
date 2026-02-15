import { PortfolioSnapshot } from '../../domain/entities';
import { IDataExportService } from '../../application/interfaces';

/**
 * CSV Export Service
 * 
 * Exports portfolio data to CSV format.
 * Generates two files:
 * 1. Portfolio history (all operations)
 * 2. Yearly summary (final position per year)
 */
export class CSVExportService implements IDataExportService {
  exportPortfolioData(snapshots: PortfolioSnapshot[]): void {
    const portfolioCSV = this.generatePortfolioHistoryCSV(snapshots);
    const yearlyCSV = this.generateYearlySummaryCSV(snapshots);

    this.downloadCSV(portfolioCSV, 'portfolio_history.csv');
    this.downloadCSV(yearlyCSV, 'yearly_summary.csv');
  }

  private generatePortfolioHistoryCSV(snapshots: PortfolioSnapshot[]): string {
    if (snapshots.length === 0) {
      return '';
    }

    // Get headers from first snapshot
    const headers = snapshots[0]!.getCSVHeaders();
    
    // Get rows from all snapshots
    const rows = snapshots.map(snapshot => snapshot.toCSVRow());

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateYearlySummaryCSV(snapshots: PortfolioSnapshot[]): string {
    const headers = [
      'Ano',
      'Quantidade Final',
      'Custo Acumulado USD',
      'Preço Médio USD',
      'Custo Acumulado BRL',
      'Preço Médio BRL',
      'Ganho/Perda Total BRL',
    ];

    // Get last snapshot per year
    const yearlySnapshots = this.getYearlySnapshots(snapshots);

    const rows = Array.from(yearlySnapshots.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, snapshot]) => {
        const position = snapshot.position;
        
        return [
          year.toString(),
          position.quantity.value.toString(),
          position.totalCostUsd.amount.toFixed(4),
          position.averagePriceUsd.amount.toFixed(4),
          position.totalCostBrl.amount.toFixed(4),
          position.averagePriceBrl.amount.toFixed(4),
          position.grossProfitBrl.amount.toFixed(4),
        ];
      });

    return this.arrayToCSV([headers, ...rows]);
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
