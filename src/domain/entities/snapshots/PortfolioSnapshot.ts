import { PortfolioPosition } from '../portfolio/PortfolioPosition';
import { OperationMetadata } from '../operations/OperationMetadata';
import { ProfitLoss } from '../core/ProfitLoss';

/**
 * Snapshot of portfolio state at a specific point in time
 *
 * Combines portfolio position with operation metadata to provide
 * a complete view for reporting and UI display.
 * Serialization (CSV, JSON) is handled by PortfolioSnapshotSerializer
 * in the infrastructure layer.
 */
export class PortfolioSnapshot {
  constructor(
    public readonly position: PortfolioPosition,
    public readonly metadata: OperationMetadata,
    public readonly previousPosition: PortfolioPosition | null = null
  ) {}

  getOperationDescription(): string {
    const sign = this.metadata.isVesting ? '+' : '-';
    return `${this.metadata.operationType} (${sign}${this.metadata.quantity.value})`;
  }

  /**
   * Calculate profit/loss for this specific operation.
   * Returns null for vesting operations.
   */
  getOperationProfitLoss(): ProfitLoss | null {
    if (!this.metadata.tradeFinancials || !this.previousPosition) {
      return null;
    }
    const profitDiff =
      this.position.grossProfitBrl.amount - this.previousPosition.grossProfitBrl.amount;
    return new ProfitLoss(profitDiff, 'BRL');
  }
}

