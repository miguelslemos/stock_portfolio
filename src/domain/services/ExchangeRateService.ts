import { ExchangeRate } from '../entities';

export interface ExchangeRateService {
  getRate(fromCurrency: string, toCurrency: string, date: Date): Promise<ExchangeRate | null>;
}

