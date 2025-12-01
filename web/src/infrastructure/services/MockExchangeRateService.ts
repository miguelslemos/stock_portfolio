import { ExchangeRate } from '../../domain/entities';
import { ExchangeRateService } from '../../domain/services';

export class MockExchangeRateService implements ExchangeRateService {
  constructor(private readonly defaultRate: number = 5.0) {}

  async getRate(fromCurrency: string, toCurrency: string, date: Date): Promise<ExchangeRate | null> {
    if (fromCurrency !== 'USD' || toCurrency !== 'BRL') {
      throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
    }

    return new ExchangeRate('USD', 'BRL', date, this.defaultRate, this.defaultRate);
  }
}

