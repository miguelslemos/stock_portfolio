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
      'Tentativa de vender 150 ações, mas apenas 100 disponíveis no portfólio'
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
      'Tentativa de vender 50 ações, mas apenas 0 disponíveis no portfólio'
    );
  });

  it('should compute capital gain as (qty × priceUSD × ptaxAsk) - (qty × avgPriceBRL)', () => {
    // Simulate a position built from two vestings at different PTAX rates:
    // 1st vesting: 100 shares at $10, PTAX 5.0 → cost BRL = 5,000
    // 2nd vesting: 100 shares at $10, PTAX 4.0 → cost BRL = 4,000
    // Total: 200 shares, totalCostUsd = 2,000, totalCostBrl = 9,000
    // avgPriceUsd = 10, avgPriceBrl = 9,000 / 200 = 45
    const currentPosition = new PortfolioPosition(
      new StockQuantity(200),
      new Money(2000, 'USD'),
      new Money(9000, 'BRL'),   // accumulated at different PTAX rates
      new Money(10, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date('2023-06-01')
    );

    // Sell 100 shares at $12, PTAX bid=4.8, ask=4.9
    const trade = new TradeOperation(
      new Date('2023-07-01'),
      new StockQuantity(100),
      new Money(12, 'USD')
    );
    const exchangeRate = new ExchangeRate('USD', 'BRL', new Date('2023-07-01'), 4.8, 4.9);

    const result = trade.execute(currentPosition, exchangeRate);
    const financials = result.metadata.tradeFinancials!;

    // Revenue BRL = 100 × $12 × 4.9 (ask) = 5,880
    expect(financials.saleRevenueBrl.amount).toBeCloseTo(5880, 2);

    // Cost basis BRL = 100 × 45 (avgPriceBrl) = 4,500
    // NOT the old formula: 100 × $10 × 4.8 (bid) = 4,800
    expect(financials.costBasisBrl.amount).toBeCloseTo(4500, 2);

    // Capital gain = 5,880 - 4,500 = 1,380
    // NOT the old: 5,880 - 4,800 = 1,080
    expect(financials.profitLossBrl.amount).toBeCloseTo(1380, 2);
  });

  it('should reset average prices to zero on full liquidation', () => {
    const operation = new TradeOperation(
      new Date('2023-02-15'),
      new StockQuantity(100),
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

    const exchangeRate = new ExchangeRate('USD', 'BRL', new Date('2023-02-15'), 5.0, 5.1);

    const result = operation.execute(currentPosition, exchangeRate);

    expect(result.position.quantity.value).toBe(0);
    expect(result.position.totalCostUsd.amount).toBe(0);
    expect(result.position.totalCostBrl.amount).toBe(0);
    expect(result.position.averagePriceUsd.amount).toBe(0);
    expect(result.position.averagePriceBrl.amount).toBe(0);
    expect(result.position.isEmpty).toBe(true);
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

