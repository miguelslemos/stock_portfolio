import { describe, it, expect } from 'vitest';
import { StockQuantity } from '../core/StockQuantity';

describe('StockQuantity', () => {
  it('should create a valid stock quantity', () => {
    const quantity = new StockQuantity(100);
    expect(quantity.value).toBe(100);
  });

  it('should throw error for negative quantity', () => {
    expect(() => new StockQuantity(-10)).toThrow('Stock quantity cannot be negative');
  });

  it('should throw error for non-integer quantity', () => {
    expect(() => new StockQuantity(10.5)).toThrow('Stock quantity must be an integer');
  });

  it('should add two quantities', () => {
    const qty1 = new StockQuantity(100);
    const qty2 = new StockQuantity(50);
    const result = qty1.add(qty2);
    expect(result.value).toBe(150);
  });

  it('should subtract two quantities', () => {
    const qty1 = new StockQuantity(100);
    const qty2 = new StockQuantity(30);
    const result = qty1.subtract(qty2);
    expect(result.value).toBe(70);
  });

  it('should format to string', () => {
    const quantity = new StockQuantity(100);
    expect(quantity.toString()).toBe('100');
  });
});

