import {
  Money,
  StockQuantity,
  PortfolioPosition,
  OperationResult,
  OperationMetadata,
  ExchangeRate,
  ProfitLoss,
  type TradeFinancials,
} from '../entities';
import { PortfolioOperation } from './PortfolioOperation';

/**
 * Trade Operation - Stock Sale
 * 
 * Represents selling shares from the portfolio.
 * Reduces quantity and total cost proportionally and calculates profit/loss.
 * 
 * Business Rules:
 * - Uses ask rate (PTAX venda) for sale revenue calculation
 * - Cost basis in BRL uses accumulated average price BRL (totalCostBrl / qty)
 * - Generates profit/loss in BRL
 * - Average prices remain constant (proportional cost method)
 */
export class TradeOperation implements PortfolioOperation {
  private readonly _settlementDate: Date | null;

  constructor(
    public readonly date: Date,
    public readonly quantity: StockQuantity,
    public readonly pricePerShareUsd: Money,
    settlementDate: Date | null = null
  ) {
    if (pricePerShareUsd.currency !== 'USD') {
      throw new Error('Trade price must be in USD');
    }
    if (quantity.value <= 0) {
      throw new Error('Trade quantity must be positive');
    }
    this._settlementDate = settlementDate;
  }

  get settlementDate(): Date {
    return this._settlementDate ?? this.date;
  }

  /**
   * Execute the trade operation
   * 
   * @param currentPosition - Current portfolio state
   * @param exchangeRate - Exchange rate for the settlement date
   * @returns OperationResult with new position and metadata
   */
  execute(currentPosition: PortfolioPosition, exchangeRate: ExchangeRate): OperationResult {
    // Validate trade is possible
    if (this.quantity.value > currentPosition.quantity.value) {
      throw new Error(
        `Cannot sell ${this.quantity.value} shares, only ${currentPosition.quantity.value} available`
      );
    }

    if (currentPosition.quantity.value === 0) {
      throw new Error('Cannot sell from empty portfolio');
    }

    // Validate exchange rates
    const bidRate = exchangeRate.bidRate;
    const askRate = exchangeRate.askRate;
    
    if (bidRate === null || askRate === null) {
      throw new Error('Both bid and ask rates are required for trade operation');
    }

    // Calculate fraction being sold
    const fractionSold = this.quantity.value / currentPosition.quantity.value;

    // Calculate new portfolio state (proportional reduction)
    const newQuantity = new StockQuantity(
      currentPosition.quantity.value - this.quantity.value
    );
    
    const newTotalCostUsd = new Money(
      currentPosition.totalCostUsd.amount * (1 - fractionSold),
      'USD'
    );
    
    const newTotalCostBrl = new Money(
      currentPosition.totalCostBrl.amount * (1 - fractionSold),
      'BRL'
    );

    // Average prices remain the same (proportional cost method),
    // but reset to zero when portfolio is fully liquidated
    const newAvgPriceUsd = newQuantity.value === 0
      ? new Money(0, 'USD')
      : currentPosition.averagePriceUsd;

    // Calculate trade financials
    const saleRevenueUsd = new Money(
      this.pricePerShareUsd.amount * this.quantity.value,
      'USD'
    );
    
    const saleRevenueBrl = exchangeRate.convert(saleRevenueUsd); // uses ask rate

    const costBasisUsd = new Money(
      currentPosition.averagePriceUsd.amount * this.quantity.value,
      'USD'
    );

    // Cost basis BRL uses the accumulated average price BRL (totalCostBrl / qty),
    // NOT avgPriceUsd × bidRate, because each purchase was converted at its own PTAX.
    const costBasisBrl = new Money(
      currentPosition.averagePriceBrl.amount * this.quantity.value,
      'BRL'
    );

    const profitLossBrl = new ProfitLoss(
      saleRevenueBrl.amount - costBasisBrl.amount,
      'BRL'
    );

    const newGrossProfitBrl = new ProfitLoss(
      currentPosition.grossProfitBrl.amount + profitLossBrl.amount,
      'BRL'
    );

    // Create new position (clean state)
    const newPosition = new PortfolioPosition(
      newQuantity,
      newTotalCostUsd,
      newTotalCostBrl,
      newAvgPriceUsd,
      newGrossProfitBrl,
      this.date
    );

    // Create trade financials
    const tradeFinancials: TradeFinancials = {
      saleRevenueUsd,
      saleRevenueBrl,
      costBasisUsd,
      costBasisBrl,
      profitLossBrl,
    };

    // Create operation metadata
    const metadata = new OperationMetadata(
      'trade',
      this.date,
      this.settlementDate,
      this.quantity,
      this.pricePerShareUsd,
      { ptaxBid: bidRate, ptaxAsk: askRate },
      tradeFinancials
    );

    return new OperationResult(newPosition, metadata);
  }

  getDate(): Date {
    return this.date;
  }

  getSettlementDate(): Date {
    return this.settlementDate;
  }

  getDescription(): string {
    return `Trade: -${this.quantity.value} shares at $${this.pricePerShareUsd.amount.toFixed(4)}`;
  }
}
