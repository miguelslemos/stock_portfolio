import { PortfolioPosition } from '../portfolio/PortfolioPosition';
import { OperationMetadata } from './OperationMetadata';
import { ProfitLoss } from '../core/ProfitLoss';

/**
 * Result of executing a portfolio operation
 * 
 * Connects the new portfolio state with the operation metadata.
 * This is the output of operation.execute() and contains everything
 * needed to understand what happened.
 */
export class OperationResult {
  constructor(
    public readonly position: PortfolioPosition,
    public readonly metadata: OperationMetadata
  ) {}

  /**
   * Convenience getter for profit/loss
   */
  get profitLossBrl(): ProfitLoss | null {
    return this.metadata.profitLossBrl;
  }

  /**
   * Check if this operation generated profit or loss
   */
  get hasProfitLoss(): boolean {
    return this.metadata.hasProfitLoss;
  }

  /**
   * Get the PTAX bid rate used in this operation
   */
  get ptaxBid(): number {
    return this.metadata.exchangeRates.ptaxBid;
  }

  /**
   * Get the PTAX ask rate used in this operation
   */
  get ptaxAsk(): number {
    return this.metadata.exchangeRates.ptaxAsk;
  }
}


