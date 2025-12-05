import { PortfolioPosition } from '../portfolio/PortfolioPosition';
import { OperationMetadata } from '../operations/OperationMetadata';
import { ProfitLoss } from '../core/ProfitLoss';
import { CSVExportable, PDFExportable, JSONExportable, PDFSection, PDFField } from './Exportable';

/**
 * Snapshot of portfolio state at a specific point in time
 * 
 * Combines portfolio position with operation metadata to provide
 * a complete view for reporting, auditing, and exports.
 * 
 * This is the primary entity used for:
 * - CSV exports
 * - PDF reports
 * - JSON serialization
 * - UI display
 */
export class PortfolioSnapshot implements CSVExportable, PDFExportable, JSONExportable {
  constructor(
    public readonly position: PortfolioPosition,
    public readonly metadata: OperationMetadata,
    public readonly previousPosition: PortfolioPosition | null = null
  ) {}

  /**
   * Export to CSV row format
   */
  toCSVRow(): string[] {
    const ptaxBid = this.metadata.exchangeRates.ptaxBid;
    
    return [
      this.formatDate(this.metadata.operationDate),
      this.getOperationDescription(),
      this.metadata.quantity.value.toString(),
      this.position.quantity.value.toString(),
      this.position.totalCostUsd.amount.toFixed(4),
      this.position.averagePriceUsd.amount.toFixed(4),
      this.position.totalCostBrl.amount.toFixed(4),
      this.position.averagePriceBrl(ptaxBid).amount.toFixed(4),
      this.position.grossProfitBrl.amount.toFixed(4),
    ];
  }

  /**
   * Get CSV headers
   */
  getCSVHeaders(): string[] {
    return [
      'Data',
      'Operação',
      'Quantidade da Operação',
      'Quantidade Total',
      'Custo Total USD',
      'Preço Médio USD',
      'Custo Total BRL',
      'Preço Médio BRL',
      'Lucro Bruto BRL',
    ];
  }

  /**
   * Export to PDF section format
   */
  toPDFSection(): PDFSection {
    const fields: PDFField[] = [
      { label: 'Operation Date', value: this.formatDate(this.metadata.operationDate), format: 'date' },
      { label: 'Settlement Date', value: this.formatDate(this.metadata.settlementDate), format: 'date' },
      { label: 'Quantity', value: this.metadata.quantity.value, format: 'number' },
      { label: 'Price per Share', value: this.metadata.pricePerShareUsd.amount, format: 'currency', currency: 'USD' },
      { label: 'Total Quantity After', value: this.position.quantity.value, format: 'number' },
      { label: 'Average Price USD', value: this.position.averagePriceUsd.amount, format: 'currency', currency: 'USD' },
      { label: 'PTAX Bid', value: this.metadata.exchangeRates.ptaxBid, format: 'number' },
      { label: 'PTAX Ask', value: this.metadata.exchangeRates.ptaxAsk, format: 'number' },
    ];

    // Add trade-specific fields
    if (this.metadata.tradeFinancials) {
      fields.push(
        { label: 'Sale Revenue USD', value: this.metadata.tradeFinancials.saleRevenueUsd.amount, format: 'currency', currency: 'USD' },
        { label: 'Sale Revenue BRL', value: this.metadata.tradeFinancials.saleRevenueBrl.amount, format: 'currency', currency: 'BRL' },
        { label: 'Cost Basis BRL', value: this.metadata.tradeFinancials.costBasisBrl.amount, format: 'currency', currency: 'BRL' },
        { label: 'Profit/Loss BRL', value: this.metadata.tradeFinancials.profitLossBrl.amount, format: 'currency', currency: 'BRL' }
      );
    }

    fields.push(
      { label: 'Gross Profit BRL', value: this.position.grossProfitBrl.amount, format: 'currency', currency: 'BRL' }
    );

    return {
      title: this.metadata.isVesting ? 'Vesting Operation' : 'Trade Operation',
      date: this.metadata.operationDate,
      type: this.metadata.operationType,
      fields,
    };
  }

  /**
   * Export to JSON format
   */
  toJSON(): Record<string, unknown> {
    return {
      operation: {
        type: this.metadata.operationType,
        date: this.metadata.operationDate.toISOString(),
        settlementDate: this.metadata.settlementDate.toISOString(),
        quantity: this.metadata.quantity.value,
        pricePerShare: this.metadata.pricePerShareUsd.amount,
      },
      position: {
        quantity: this.position.quantity.value,
        totalCostUsd: this.position.totalCostUsd.amount,
        totalCostBrl: this.position.totalCostBrl.amount,
        averagePriceUsd: this.position.averagePriceUsd.amount,
        grossProfitBrl: this.position.grossProfitBrl.amount,
        lastUpdated: this.position.lastUpdated.toISOString(),
      },
      exchangeRates: {
        ptaxBid: this.metadata.exchangeRates.ptaxBid,
        ptaxAsk: this.metadata.exchangeRates.ptaxAsk,
      },
      tradeDetails: this.metadata.tradeFinancials ? {
        saleRevenueUsd: this.metadata.tradeFinancials.saleRevenueUsd.amount,
        saleRevenueBrl: this.metadata.tradeFinancials.saleRevenueBrl.amount,
        costBasisUsd: this.metadata.tradeFinancials.costBasisUsd.amount,
        costBasisBrl: this.metadata.tradeFinancials.costBasisBrl.amount,
        profitLossBrl: this.metadata.tradeFinancials.profitLossBrl.amount,
      } : null,
    };
  }

  /**
   * Get a human-readable description of the operation
   */
  getOperationDescription(): string {
    const sign = this.metadata.isVesting ? '+' : '-';
    return `${this.metadata.operationType} (${sign}${this.metadata.quantity.value})`;
  }

  /**
   * Calculate profit/loss for this specific operation
   * Returns null for vesting operations
   */
  getOperationProfitLoss(): ProfitLoss | null {
    if (!this.metadata.tradeFinancials || !this.previousPosition) {
      return null;
    }

    // Profit/loss is the difference in gross profit
    const profitDiff = this.position.grossProfitBrl.amount - this.previousPosition.grossProfitBrl.amount;
    return new ProfitLoss(profitDiff, 'BRL');
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

