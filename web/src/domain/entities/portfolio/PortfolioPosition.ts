import { Money } from '../core/Money';
import { ProfitLoss } from '../core/ProfitLoss';
import { StockQuantity } from '../core/StockQuantity';

/**
 * Represents the current state of a stock portfolio
 * 
 * This is a pure state entity - it only contains aggregated data
 * about the portfolio position. It does NOT contain operation metadata.
 * 
 * Immutable by design - any change creates a new instance.
 */
export class PortfolioPosition {
  constructor(
    public readonly quantity: StockQuantity,
    public readonly totalCostUsd: Money,
    public readonly totalCostBrl: Money,
    public readonly averagePriceUsd: Money,
    public readonly grossProfitBrl: ProfitLoss,
    public readonly lastUpdated: Date
  ) {
    // Validate invariants
    if (quantity.value < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (totalCostUsd.currency !== 'USD') {
      throw new Error('Total cost USD must be in USD currency');
    }
    if (totalCostBrl.currency !== 'BRL') {
      throw new Error('Total cost BRL must be in BRL currency');
    }
  }

  /**
   * Check if the portfolio is empty (no shares)
   */
  get isEmpty(): boolean {
    return this.quantity.value === 0;
  }

  /**
   * Calculate average price in BRL using a given PTAX bid rate
   * @param ptaxBid - The PTAX buy rate to use for conversion
   */
  averagePriceBrl(ptaxBid: number): Money {
    if (ptaxBid <= 0) {
      throw new Error('PTAX bid rate must be positive');
    }
    return new Money(this.averagePriceUsd.amount * ptaxBid, 'BRL');
  }

  /**
   * Calculate average price per share
   * @param currency - Currency to calculate in ('USD' or 'BRL')
   * @param ptaxBid - Required if currency is 'BRL'
   */
  calculateAveragePrice(currency: string, ptaxBid?: number): Money {
    if (this.isEmpty) {
      return new Money(0, currency);
    }

    if (currency === 'USD') {
      return new Money(this.totalCostUsd.amount / this.quantity.value, 'USD');
    } else if (currency === 'BRL') {
      if (ptaxBid === undefined) {
        throw new Error('PTAX bid rate is required to calculate BRL average price');
      }
      return this.averagePriceBrl(ptaxBid);
    } else {
      throw new Error(`Unsupported currency: ${currency}`);
    }
  }

  /**
   * Create an empty portfolio position
   */
  static createEmpty(date: Date): PortfolioPosition {
    return new PortfolioPosition(
      new StockQuantity(0),
      new Money(0, 'USD'),
      new Money(0, 'BRL'),
      new Money(0, 'USD'),
      new ProfitLoss(0, 'BRL'),
      date
    );
  }

  /**
   * Reset gross profit for a new fiscal year
   * Returns a new position with profit reset to zero
   */
  resetGrossProfitForNewYear(): PortfolioPosition {
    return new PortfolioPosition(
      this.quantity,
      this.totalCostUsd,
      this.totalCostBrl,
      this.averagePriceUsd,
      new ProfitLoss(0, 'BRL'),
      this.lastUpdated
    );
  }
}


