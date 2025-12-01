import { Money } from '../core/Money';
import { StockQuantity } from '../core/StockQuantity';
import { ProfitLoss } from '../core/ProfitLoss';

export type OperationType = 'vesting' | 'trade';

/**
 * Exchange rates used in an operation
 */
export interface ExchangeRates {
  readonly ptaxBid: number;  // Buy rate (taxa de compra)
  readonly ptaxAsk: number;  // Sell rate (taxa de venda)
}

/**
 * Financial details specific to trade operations
 */
export interface TradeFinancials {
  readonly saleRevenueUsd: Money;
  readonly saleRevenueBrl: Money;
  readonly costBasisUsd: Money;
  readonly costBasisBrl: Money;
  readonly profitLossBrl: ProfitLoss;
}

/**
 * Metadata about a portfolio operation
 * Contains all context about what happened in the operation
 * Immutable and used for auditing, reporting, and exports
 */
export class OperationMetadata {
  constructor(
    public readonly operationType: OperationType,
    public readonly operationDate: Date,
    public readonly settlementDate: Date,
    public readonly quantity: StockQuantity,
    public readonly pricePerShareUsd: Money,
    public readonly exchangeRates: ExchangeRates,
    public readonly tradeFinancials?: TradeFinancials
  ) {}

  get isVesting(): boolean {
    return this.operationType === 'vesting';
  }

  get isTrade(): boolean {
    return this.operationType === 'trade';
  }

  get hasProfitLoss(): boolean {
    return this.tradeFinancials !== undefined;
  }

  get profitLossBrl(): ProfitLoss | null {
    return this.tradeFinancials?.profitLossBrl ?? null;
  }

  /**
   * Get the total cost of this operation in USD
   */
  get totalCostUsd(): Money {
    return new Money(
      this.pricePerShareUsd.amount * this.quantity.value,
      'USD'
    );
  }

  /**
   * Get the total cost of this operation in BRL (using bid rate)
   */
  get totalCostBrl(): Money {
    return new Money(
      this.totalCostUsd.amount * this.exchangeRates.ptaxBid,
      'BRL'
    );
  }
}

