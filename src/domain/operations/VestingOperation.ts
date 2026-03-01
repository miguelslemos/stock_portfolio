import {
  Money,
  StockQuantity,
  PortfolioPosition,
  OperationResult,
  OperationMetadata,
  ExchangeRate,
} from '../entities';
import { PortfolioOperation } from './PortfolioOperation';

/**
 * Vesting Operation - Stock Grant
 * 
 * Represents receiving shares through vesting (stock compensation).
 * Adds shares to the portfolio at a specific price, increasing both
 * quantity and total cost proportionally.
 * 
 * Business Rules:
 * - Uses bid rate (PTAX compra) for cost conversion to BRL
 * - Does not generate profit/loss
 * - Updates average prices using weighted average
 */
export class VestingOperation implements PortfolioOperation {
  private readonly _settlementDate: Date | null;

  constructor(
    public readonly date: Date,
    public readonly quantity: StockQuantity,
    public readonly pricePerShareUsd: Money,
    settlementDate: Date | null = null
  ) {
    if (pricePerShareUsd.currency !== 'USD') {
      throw new Error('Vesting price must be in USD');
    }
    if (quantity.value <= 0) {
      throw new Error('Vesting quantity must be positive');
    }
    this._settlementDate = settlementDate;
  }

  get settlementDate(): Date {
    return this._settlementDate ?? this.date;
  }

  /**
   * Execute the vesting operation
   * 
   * @param currentPosition - Current portfolio state
   * @param exchangeRate - Exchange rate for the settlement date
   * @returns OperationResult with new position and metadata
   */
  execute(currentPosition: PortfolioPosition, exchangeRate: ExchangeRate): OperationResult {
    // Validate exchange rate
    const bidRate = exchangeRate.bidRate;
    const askRate = exchangeRate.askRate;
    
    if (bidRate === null || askRate === null) {
      throw new Error('Cotações PTAX (compra e venda) não encontradas para processar este vesting');
    }

    // Calculate vesting costs
    const vestingCostUsd = new Money(
      this.pricePerShareUsd.amount * this.quantity.value,
      'USD'
    );
    const vestingCostBrl = exchangeRate.convert(vestingCostUsd, true); // use bid rate

    // Calculate new portfolio state
    const newQuantity = new StockQuantity(
      currentPosition.quantity.value + this.quantity.value
    );
    
    const newTotalCostUsd = new Money(
      currentPosition.totalCostUsd.amount + vestingCostUsd.amount,
      'USD'
    );
    
    const newTotalCostBrl = new Money(
      currentPosition.totalCostBrl.amount + vestingCostBrl.amount,
      'BRL'
    );

    const newAvgPriceUsd = new Money(
      newQuantity.value > 0 ? newTotalCostUsd.amount / newQuantity.value : 0,
      'USD'
    );

    // Create new position (clean state)
    const newPosition = new PortfolioPosition(
      newQuantity,
      newTotalCostUsd,
      newTotalCostBrl,
      newAvgPriceUsd,
      currentPosition.grossProfitBrl, // No profit/loss on vesting
      this.date
    );

    // Create operation metadata
    const metadata = new OperationMetadata(
      'vesting',
      this.date,
      this.settlementDate,
      this.quantity,
      this.pricePerShareUsd,
      { ptaxBid: bidRate, ptaxAsk: askRate },
      undefined // No trade financials for vesting
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
    return `Vesting: +${this.quantity.value} shares at $${this.pricePerShareUsd.amount.toFixed(4)}`;
  }
}
