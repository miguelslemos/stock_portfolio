import { describe, it, expect } from 'vitest';
import { TradeOperation } from '../TradeOperation';
import { Money, StockQuantity, ExchangeRate, PortfolioPosition, ProfitLoss } from '../../entities';

describe('TradeOperation', () => {
  it('should create a valid trade operation', () => {
    const date = new Date('2023-02-15');
    const quantity = new StockQuantity(50);
    const price = new Money(18, 'USD');

    const operation = new TradeOperation(date, quantity, price);

    expect(operation.date).toBe(date);
    expect(operation.quantity.value).toBe(50);
    expect(operation.pricePerShareUsd.amount).toBe(18);
  });

  it('should throw error for non-USD price', () => {
    const date = new Date('2023-02-15');
    const quantity = new StockQuantity(50);
    const price = new Money(18, 'BRL');

    expect(() => new TradeOperation(date, quantity, price)).toThrow('Trade price must be in USD');
  });

  it('should execute trade operation with profit', () => {
    const date = new Date('2023-02-15');
    const quantity = new StockQuantity(50);
    const price = new Money(20, 'USD');
    const operation = new TradeOperation(date, quantity, price);

    const currentPosition = new PortfolioPosition(
      new StockQuantity(100),
      new Money(1500, 'USD'),
      new Money(7500, 'BRL'),
      new Money(15, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date('2023-01-01')
    );

    const exchangeRate = new ExchangeRate('USD', 'BRL', date, 5.0, 5.0);

    const result = operation.execute(currentPosition, exchangeRate);

    expect(result.position.quantity.value).toBe(50);
    expect(result.hasProfitLoss).toBe(true);
    expect(result.profitLossBrl?.amount).toBeGreaterThan(0);
  });

  it('should throw error when selling more than available', () => {
    const operation = new TradeOperation(
      new Date('2023-02-15'),
      new StockQuantity(150),
      new Money(20, 'USD')
    );

    const currentPosition = new PortfolioPosition(
      new StockQuantity(100),
      new Money(1500, 'USD'),
      new Money(7500, 'BRL'),
      new Money(15, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date('2023-01-01')
    );

    const exchangeRate = new ExchangeRate('USD', 'BRL', new Date('2023-02-15'), 5.0, 5.0);

    expect(() => operation.execute(currentPosition, exchangeRate)).toThrow(
      'Cannot sell 150 shares, only 100 available'
    );
  });

  it('should throw error when selling from empty portfolio', () => {
    const operation = new TradeOperation(
      new Date('2023-02-15'),
      new StockQuantity(50),
      new Money(20, 'USD')
    );

    const emptyPosition = new PortfolioPosition(
      new StockQuantity(0),
      new Money(0, 'USD'),
      new Money(0, 'BRL'),
      new Money(0, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date('2023-01-01')
    );

    const exchangeRate = new ExchangeRate('USD', 'BRL', new Date('2023-02-15'), 5.0, 5.0);

    expect(() => operation.execute(emptyPosition, exchangeRate)).toThrow(
      'Cannot sell 50 shares, only 0 available'
    );
  });

  it('should return correct description', () => {
    const operation = new TradeOperation(
      new Date('2023-02-15'),
      new StockQuantity(50),
      new Money(18.75, 'USD')
    );

    expect(operation.getDescription()).toBe('Trade: -50 shares at $18.7500');
  });
});

