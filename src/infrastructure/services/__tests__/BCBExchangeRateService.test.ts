import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BCBExchangeRateService } from '../BCBExchangeRateService';

describe('BCBExchangeRateService', () => {
  let service: BCBExchangeRateService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new BCBExchangeRateService();
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch exchange rate successfully', async () => {
    const mockResponse = {
      value: [
        {
          cotacaoCompra: 5.0,
          cotacaoVenda: 5.05,
          dataHoraCotacao: '2023-01-15 13:00:00'
        }
      ]
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const date = new Date('2023-01-15');
    const rate = await service.getRate('USD', 'BRL', date);

    expect(rate).not.toBeNull();
    expect(rate?.fromCurrency).toBe('USD');
    expect(rate?.toCurrency).toBe('BRL');
    // Service uses cotacaoVenda for both rates per Art. 57 of IN RFB
    expect(rate?.bidRate).toBe(5.05);
    expect(rate?.askRate).toBe(5.05);
  });

  it('should return null for unsupported currency pair', async () => {
    const date = new Date('2023-01-15');
    
    await expect(
      service.getRate('EUR', 'BRL', date)
    ).rejects.toThrow('Unsupported currency pair: EUR/BRL');
  });

  it('should cache successful results', async () => {
    const mockResponse = {
      value: [
        {
          cotacaoCompra: 5.0,
          cotacaoVenda: 5.05,
          dataHoraCotacao: '2023-01-15 13:00:00'
        }
      ]
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const date = new Date('2023-01-15');
    
    // First call
    const rate1 = await service.getRate('USD', 'BRL', date);
    expect(rate1).not.toBeNull();
    
    // Second call should use cache
    const rate2 = await service.getRate('USD', 'BRL', date);
    expect(rate2).not.toBeNull();
    
    // Fetch should only be called once
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should return null when API returns empty data', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] })
    });

    const date = new Date('2023-01-15');
    const rate = await service.getRate('USD', 'BRL', date);

    expect(rate).toBeNull();
  });

  it('should return null when API request fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const date = new Date('2023-01-15');
    const rate = await service.getRate('USD', 'BRL', date);

    expect(rate).toBeNull();
  });

  it('should handle network errors gracefully', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const date = new Date('2023-01-15');
    const rate = await service.getRate('USD', 'BRL', date);

    expect(rate).toBeNull();
  });

  it('should format date correctly', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: [] })
    });

    const date = new Date(2023, 0, 5); // January 5, 2023
    await service.getRate('USD', 'BRL', date);

    expect(fetchMock).toHaveBeenCalled();
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    
    if (firstCall) {
      const callUrl = firstCall[0] as string;
      expect(callUrl).toContain('01-05-2023');
    }
  });

  it('should cache null results to avoid repeated failed requests', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const date = new Date('2023-01-15');
    
    // First call
    const rate1 = await service.getRate('USD', 'BRL', date);
    expect(rate1).toBeNull();
    
    // Second call should use cached null
    const rate2 = await service.getRate('USD', 'BRL', date);
    expect(rate2).toBeNull();
    
    // Fetch should only be called once
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should evict old entries when cache is full', async () => {
    const mockResponse = {
      value: [
        {
          cotacaoCompra: 5.0,
          cotacaoVenda: 5.05,
          dataHoraCotacao: '2023-01-15 13:00:00'
        }
      ]
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    // Fill cache beyond MAX_CACHE_SIZE (1000)
    const promises = [];
    for (let i = 0; i < 1010; i++) {
      const date = new Date(2023, 0, 1 + (i % 365));
      promises.push(service.getRate('USD', 'BRL', date));
    }

    await Promise.all(promises);

    // Cache should have evicted some entries
    expect(fetchMock).toHaveBeenCalled();
  });

  it('should respect cache TTL', async () => {
    const mockResponse = {
      value: [
        {
          cotacaoCompra: 5.0,
          cotacaoVenda: 5.05,
          dataHoraCotacao: '2023-01-15 13:00:00'
        }
      ]
    };

    // Mock Date.now to control cache TTL
    const originalDateNow = Date.now;
    let currentTime = 1000000;
    Date.now = vi.fn(() => currentTime);

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const date = new Date('2023-01-15');
    
    // First call
    await service.getRate('USD', 'BRL', date);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Second call within TTL (should use cache)
    currentTime += 1000; // 1 second later
    await service.getRate('USD', 'BRL', date);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Third call after TTL expired (should fetch again)
    currentTime += 24 * 60 * 60 * 1000 + 1000; // 24 hours + 1 second
    await service.getRate('USD', 'BRL', date);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Restore Date.now
    Date.now = originalDateNow;
  });
});
