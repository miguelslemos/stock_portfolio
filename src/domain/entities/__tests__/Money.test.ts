import { describe, it, expect } from 'vitest';
import { Money } from '../core/Money';

describe('Money', () => {
  it('should create a valid money instance', () => {
    const money = new Money(100, 'USD');
    expect(money.amount).toBe(100);
    expect(money.currency).toBe('USD');
  });

  it('should throw error for non-finite amount', () => {
    expect(() => new Money(NaN, 'USD')).toThrow('Money amount must be a finite number');
    expect(() => new Money(Infinity, 'USD')).toThrow('Money amount must be a finite number');
    expect(() => new Money(-Infinity, 'USD')).toThrow('Money amount must be a finite number');
  });

  it('should allow negative amounts', () => {
    const money = new Money(-100, 'USD');
    expect(money.amount).toBe(-100);
    expect(money.currency).toBe('USD');
  });

  it('should allow zero amount', () => {
    const money = new Money(0, 'USD');
    expect(money.amount).toBe(0);
    expect(money.currency).toBe('USD');
  });

  it('should throw error for empty currency', () => {
    expect(() => new Money(100, '')).toThrow('Currency is required');
  });

  it('should throw error for whitespace-only currency', () => {
    expect(() => new Money(100, '   ')).toThrow('Currency is required');
  });

  it('should add two money instances with same currency', () => {
    const money1 = new Money(100, 'USD');
    const money2 = new Money(50, 'USD');
    const result = money1.add(money2);
    expect(result.amount).toBe(150);
    expect(result.currency).toBe('USD');
  });

  it('should add negative amounts', () => {
    const money1 = new Money(100, 'USD');
    const money2 = new Money(-30, 'USD');
    const result = money1.add(money2);
    expect(result.amount).toBe(70);
  });

  it('should throw error when adding different currencies', () => {
    const money1 = new Money(100, 'USD');
    const money2 = new Money(50, 'BRL');
    expect(() => money1.add(money2)).toThrow('Cannot add BRL to USD');
  });

  it('should subtract two money instances', () => {
    const money1 = new Money(100, 'USD');
    const money2 = new Money(30, 'USD');
    const result = money1.subtract(money2);
    expect(result.amount).toBe(70);
  });

  it('should subtract resulting in negative', () => {
    const money1 = new Money(50, 'USD');
    const money2 = new Money(100, 'USD');
    const result = money1.subtract(money2);
    expect(result.amount).toBe(-50);
  });

  it('should throw error when subtracting different currencies', () => {
    const money1 = new Money(100, 'USD');
    const money2 = new Money(50, 'BRL');
    expect(() => money1.subtract(money2)).toThrow('Cannot subtract BRL from USD');
  });

  it('should multiply by a positive factor', () => {
    const money = new Money(100, 'USD');
    const result = money.multiply(2.5);
    expect(result.amount).toBe(250);
  });

  it('should multiply by zero', () => {
    const money = new Money(100, 'USD');
    const result = money.multiply(0);
    expect(result.amount).toBe(0);
  });

  it('should multiply by negative factor', () => {
    const money = new Money(100, 'USD');
    const result = money.multiply(-2);
    expect(result.amount).toBe(-200);
  });

  it('should divide by a divisor', () => {
    const money = new Money(100, 'USD');
    const result = money.divide(4);
    expect(result.amount).toBe(25);
  });

  it('should divide by negative divisor', () => {
    const money = new Money(100, 'USD');
    const result = money.divide(-2);
    expect(result.amount).toBe(-50);
  });

  it('should throw error when dividing by zero', () => {
    const money = new Money(100, 'USD');
    expect(() => money.divide(0)).toThrow('Cannot divide by zero');
  });

  it('should handle decimal precision', () => {
    const money1 = new Money(10.55, 'USD');
    const money2 = new Money(5.25, 'USD');
    const result = money1.add(money2);
    expect(result.amount).toBeCloseTo(15.80, 2);
  });

  it('should preserve currency in all operations', () => {
    const money = new Money(100, 'BRL');
    expect(money.multiply(2).currency).toBe('BRL');
    expect(money.divide(2).currency).toBe('BRL');
    expect(money.add(new Money(50, 'BRL')).currency).toBe('BRL');
    expect(money.subtract(new Money(25, 'BRL')).currency).toBe('BRL');
  });
});
