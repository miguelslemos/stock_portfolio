import { PortfolioSnapshot } from '../../domain/entities';

/**
 * Interface for data export services
 * 
 * Services implementing this interface can export portfolio data
 * in various formats (CSV, PDF, Excel, etc.)
 */
export interface IDataExportService {
  /**
   * Export portfolio data using snapshots
   * @param snapshots - Array of portfolio snapshots to export
   */
  exportPortfolioData(snapshots: PortfolioSnapshot[]): void;
}

