import { Money } from './Money';

export class ExchangeRate {
  constructor(
    public readonly fromCurrency: string,
    public readonly toCurrency: string,
    public readonly date: Date,
    public readonly bidRate: number | null = null,
    public readonly askRate: number | null = null
  ) {
    if (bidRate !== null && bidRate <= 0) {
      throw new Error('Bid rate must be positive');
    }
    if (askRate !== null && askRate <= 0) {
      throw new Error('Ask rate must be positive');
    }
    if (bidRate === null && askRate === null) {
      throw new Error('At least one of bidRate or askRate must be provided');
    }
  }

  convert(amount: Money, useBid = false): Money {
    if (amount.currency !== this.fromCurrency) {
      throw new Error(
        `Cannot convert ${amount.currency} using ${this.fromCurrency}/${this.toCurrency} rate`
      );
    }

    const conversionRate = useBid ? this.bidRate : this.askRate;

    if (conversionRate === null) {
      throw new Error(`${useBid ? 'Bid' : 'Ask'} rate is not available`);
    }

    const convertedAmount = amount.amount * conversionRate;
    return new Money(convertedAmount, this.toCurrency);
  }
}

