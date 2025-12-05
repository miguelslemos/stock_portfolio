import { ExchangeRate } from '../../domain/entities';
import { ExchangeRateService } from '../../domain/services';

interface BCBResponse {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
  }>;
}

interface CacheEntry {
  rate: ExchangeRate | null;
  timestamp: number;
}

export class BCBExchangeRateService implements ExchangeRateService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 5000;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000;

  async getRate(fromCurrency: string, toCurrency: string, date: Date): Promise<ExchangeRate | null> {
    if (fromCurrency !== 'USD' || toCurrency !== 'BRL') {
      throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
    }

    const cacheKey = `${fromCurrency}-${toCurrency}-${date.toISOString().split('T')[0]}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.rate;
    }

    // Evict old entries if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestEntries();
    }

    // Fetch from BCB API
    try {
      const rate = await this.fetchRateFromBCB(date);
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      return rate;
    } catch (error) {
      // Cache null result to avoid repeated failed requests
      this.cache.set(cacheKey, { rate: null, timestamp: Date.now() });
      return null;
    }
  }

  private evictOldestEntries(): void {
    // Remove oldest 20% of entries
    const entriesToRemove = Math.floor(this.cache.size * 0.2);
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < entriesToRemove; i++) {
      const key = sortedEntries[i]?.[0];
      if (key) {
        this.cache.delete(key);
      }
    }
  }

  private async fetchRateFromBCB(date: Date): Promise<ExchangeRate | null> {
    const dateStr = this.formatDate(date);
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$format=json`;

    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as BCBResponse;

      if (data.value && data.value.length > 0) {
        const rateData = data.value[0]!;
        return new ExchangeRate(
          'USD',
          'BRL',
          date,
          rateData.cotacaoCompra,
          rateData.cotacaoVenda
        );
      }

      return null;
    } catch (error) {
      // Add context to the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch exchange rate from BCB for ${dateStr}: ${errorMessage}`);
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        // Check if response is valid before accessing properties
        if (!response) {
          throw new Error('Fetch returned null or undefined response');
        }

        if (response.ok || response.status === 404) {
          return response;
        }

        throw new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
        
        // Don't retry on abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.TIMEOUT_MS}ms`);
        }
        
        if (attempt < this.MAX_RETRIES - 1) {
          // Exponential backoff: 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed after ${this.MAX_RETRIES} retries: ${errorMessage}`);
  }

  private formatDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }
}
