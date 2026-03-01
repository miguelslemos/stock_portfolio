import { describe, it, expect } from 'vitest';
import { ExchangeRate } from '../core/ExchangeRate';
import { Money } from '../core/Money';

describe('ExchangeRate', () => {
  describe('construction', () => {
    it('creates with both rates', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 5.0, 5.1);
      expect(rate.bidRate).toBe(5.0);
      expect(rate.askRate).toBe(5.1);
    });

    it('creates with only ask rate', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), null, 5.0);
      expect(rate.bidRate).toBeNull();
      expect(rate.askRate).toBe(5.0);
    });

    it('creates with only bid rate', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 5.0, null);
      expect(rate.bidRate).toBe(5.0);
      expect(rate.askRate).toBeNull();
    });

    it('throws when both rates are null', () => {
      expect(() => new ExchangeRate('USD', 'BRL', new Date(), null, null)).toThrow(
        'At least one of bidRate or askRate must be provided'
      );
    });

    it('throws when bid rate is zero or negative', () => {
      expect(() => new ExchangeRate('USD', 'BRL', new Date(), 0, 5.0)).toThrow('Bid rate must be positive');
      expect(() => new ExchangeRate('USD', 'BRL', new Date(), -1, 5.0)).toThrow('Bid rate must be positive');
    });

    it('throws when ask rate is zero or negative', () => {
      expect(() => new ExchangeRate('USD', 'BRL', new Date(), 5.0, 0)).toThrow('Ask rate must be positive');
      expect(() => new ExchangeRate('USD', 'BRL', new Date(), 5.0, -1)).toThrow('Ask rate must be positive');
    });
  });

  describe('fromPTAX', () => {
    it('creates exchange rate where bid and ask are both cotacaoVenda', () => {
      const date = new Date('2023-06-01');
      const rate = ExchangeRate.fromPTAX(5.25, date);
      expect(rate.fromCurrency).toBe('USD');
      expect(rate.toCurrency).toBe('BRL');
      expect(rate.bidRate).toBe(5.25);
      expect(rate.askRate).toBe(5.25);
      expect(rate.date).toBe(date);
    });
  });

  describe('convert', () => {
    it('converts using ask rate by default', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 4.9, 5.0);
      const usd = new Money(100, 'USD');
      const result = rate.convert(usd);
      expect(result.amount).toBe(500);
      expect(result.currency).toBe('BRL');
    });

    it('converts using bid rate when requested', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 4.9, 5.0);
      const usd = new Money(100, 'USD');
      const result = rate.convert(usd, true);
      expect(result.amount).toBeCloseTo(490, 10);
    });

    it('throws when converting wrong currency', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 5.0, 5.0);
      const brl = new Money(100, 'BRL');
      expect(() => rate.convert(brl)).toThrow('Cannot convert BRL using USD/BRL rate');
    });

    it('throws when ask rate is not available for ask conversion', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), 5.0, null);
      const usd = new Money(100, 'USD');
      expect(() => rate.convert(usd, false)).toThrow('Ask rate is not available');
    });

    it('throws when bid rate is not available for bid conversion', () => {
      const rate = new ExchangeRate('USD', 'BRL', new Date(), null, 5.0);
      const usd = new Money(100, 'USD');
      expect(() => rate.convert(usd, true)).toThrow('Bid rate is not available');
    });
  });
});
