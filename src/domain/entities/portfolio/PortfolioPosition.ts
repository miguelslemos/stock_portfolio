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
  private _averagePriceBrl: Money | null = null;

  constructor(
    public readonly quantity: StockQuantity,
    public readonly totalCostUsd: Money,
    public readonly totalCostBrl: Money,
    public readonly averagePriceUsd: Money,
    public readonly grossProfitBrl: ProfitLoss,
    public readonly lastUpdated: Date
  ) {
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

  get isEmpty(): boolean {
    return this.quantity.value === 0;
  }

  /**
   * Average price per share in BRL, derived from the accumulated total cost
   * in BRL (where each purchase was converted at that day's PTAX rate)
   * divided by the total quantity of shares.
   * Cached on first access since the class is immutable.
   */
  get averagePriceBrl(): Money {
    if (this._averagePriceBrl === null) {
      this._averagePriceBrl = this.isEmpty
        ? new Money(0, 'BRL')
        : new Money(this.totalCostBrl.amount / this.quantity.value, 'BRL');
    }
    return this._averagePriceBrl;
  }

  /**
   * Calculate average price per share
   * @param currency - Currency to calculate in ('USD' or 'BRL')
   */
  calculateAveragePrice(currency: string): Money {
    if (this.isEmpty) {
      return new Money(0, currency);
    }

    if (currency === 'USD') {
      return new Money(this.totalCostUsd.amount / this.quantity.value, 'USD');
    } else if (currency === 'BRL') {
      return this.averagePriceBrl;
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


