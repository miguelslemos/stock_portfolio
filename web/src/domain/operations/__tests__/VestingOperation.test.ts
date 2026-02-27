import { describe, it, expect } from 'vitest';
import { VestingOperation } from '../VestingOperation';
import { Money, StockQuantity, ExchangeRate, PortfolioPosition, ProfitLoss } from '../../entities';

describe('VestingOperation', () => {
  it('should create a valid vesting operation', () => {
    const date = new Date('2023-01-15');
    const quantity = new StockQuantity(100);
    const price = new Money(15.5, 'USD');

    const operation = new VestingOperation(date, quantity, price);

    expect(operation.date).toBe(date);
    expect(operation.quantity.value).toBe(100);
    expect(operation.pricePerShareUsd.amount).toBe(15.5);
  });

  it('should throw error for non-USD price', () => {
    const date = new Date('2023-01-15');
    const quantity = new StockQuantity(100);
    const price = new Money(15.5, 'BRL');

    expect(() => new VestingOperation(date, quantity, price)).toThrow('Vesting price must be in USD');
  });

  it('should execute vesting operation correctly', () => {
    const date = new Date('2023-01-15');
    const quantity = new StockQuantity(100);
    const price = new Money(15, 'USD');
    const operation = new VestingOperation(date, quantity, price);

    const currentPosition = new PortfolioPosition(
      new StockQuantity(0),
      new Money(0, 'USD'),
      new Money(0, 'BRL'),
      new Money(0, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date('2023-01-01')
    );

    const exchangeRate = new ExchangeRate('USD', 'BRL', date, 5.0, 5.0);

    const result = operation.execute(currentPosition, exchangeRate);

    expect(result.position.quantity.value).toBe(100);
    expect(result.position.totalCostUsd.amount).toBe(1500);
    expect(result.position.totalCostBrl.amount).toBe(7500);
    expect(result.position.averagePriceUsd.amount).toBe(15);
    expect(result.position.averagePriceBrl().amount).toBe(75); // 7500 / 100
    expect(result.hasProfitLoss).toBe(false);
  });

  it('should add to existing position', () => {
    const date = new Date('2023-01-15');
    const quantity = new StockQuantity(50);
    const price = new Money(20, 'USD');
    const operation = new VestingOperation(date, quantity, price);

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

    expect(result.position.quantity.value).toBe(150);
    expect(result.position.totalCostUsd.amount).toBe(2500);
    expect(result.position.totalCostBrl.amount).toBe(12500);
  });

  it('should return correct description', () => {
    const operation = new VestingOperation(
      new Date('2023-01-15'),
      new StockQuantity(100),
      new Money(15.5, 'USD')
    );

    expect(operation.getDescription()).toBe('Vesting: +100 shares at $15.5000');
  });

  it('averagePriceBrl uses accumulated BRL cost, not USD average re-converted at spot rate', () => {
    // Vesting 1: 100 shares @ $10 with PTAX 5.0 → BRL cost R$5,000
    const date1 = new Date('2023-01-15');
    const op1 = new VestingOperation(new Date('2023-01-15'), new StockQuantity(100), new Money(10, 'USD'));
    const emptyPosition = new PortfolioPosition(
      new StockQuantity(0),
      new Money(0, 'USD'),
      new Money(0, 'BRL'),
      new Money(0, 'USD'),
      new ProfitLoss(0, 'BRL'),
      date1
    );
    const rate1 = new ExchangeRate('USD', 'BRL', date1, 5.0, 5.0);
    const afterFirst = op1.execute(emptyPosition, rate1);

    // Vesting 2: 100 shares @ $10 with PTAX 6.0 → BRL cost R$6,000
    const date2 = new Date('2023-06-15');
    const op2 = new VestingOperation(date2, new StockQuantity(100), new Money(10, 'USD'));
    const rate2 = new ExchangeRate('USD', 'BRL', date2, 6.0, 6.0);
    const afterSecond = op2.execute(afterFirst.position, rate2);

    // totalCostBrl = R$5,000 + R$6,000 = R$11,000; quantity = 200
    // correct averagePriceBrl = R$11,000 / 200 = R$55.00
    // wrong (old) formula: $10 × PTAX 6.0 = R$60.00
    expect(afterSecond.position.totalCostBrl.amount).toBe(11000);
    expect(afterSecond.position.quantity.value).toBe(200);
    expect(afterSecond.position.averagePriceBrl().amount).toBe(55);
  });
});

