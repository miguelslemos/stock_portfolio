import { describe, it, expect } from 'vitest';
import { validateJsonContent } from '../useFileUpload';

const VALID_VESTING = { type: 'vesting', date: '01/15/2023', quantity: 100, price: 10 };
const VALID_TRADE = { type: 'trade', date: '06/10/2023', quantity: 50, price: 15.5 };

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe('validateJsonContent', () => {
  it('returns error for invalid JSON string', () => {
    const result = validateJsonContent('not json');
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('JSON válido');
  });

  it('returns error when JSON is not an array', () => {
    const result = validateJsonContent(json({ type: 'vesting' }));
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('array');
  });

  it('returns warning for empty array', () => {
    const result = validateJsonContent(json([]));
    expect(result.status).toBe('warning');
  });

  it('returns valid for correct vesting operation', () => {
    const result = validateJsonContent(json([VALID_VESTING]));
    expect(result.status).toBe('valid');
    expect(result.validCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid for correct trade operation', () => {
    const result = validateJsonContent(json([VALID_TRADE]));
    expect(result.status).toBe('valid');
    expect(result.validCount).toBe(1);
  });

  it('returns valid for multiple correct operations', () => {
    const result = validateJsonContent(json([VALID_VESTING, VALID_TRADE]));
    expect(result.status).toBe('valid');
    expect(result.validCount).toBe(2);
  });

  it('returns error for unknown type', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, type: 'unknown' }]));
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('"type"');
  });

  it('returns error for invalid date format', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, date: 'not-a-date' }]));
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('"date"');
  });

  it('accepts YYYY-MM-DD date format', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, date: '2023-01-15' }]));
    expect(result.status).toBe('valid');
  });

  it('returns error for non-integer quantity', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, quantity: 10.5 }]));
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('"quantity"');
  });

  it('returns error for quantity less than 1', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, quantity: 0 }]));
    expect(result.status).toBe('error');
  });

  it('returns error for negative price', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, price: -1 }]));
    expect(result.status).toBe('error');
    expect(result.errors[0]).toContain('"price"');
  });

  it('accepts price of zero', () => {
    const result = validateJsonContent(json([{ ...VALID_VESTING, price: 0 }]));
    expect(result.status).toBe('valid');
  });

  it('returns warning when some valid and some invalid', () => {
    const bad = { type: 'vesting', date: 'bad', quantity: 100, price: 10 };
    const result = validateJsonContent(json([VALID_VESTING, bad]));
    expect(result.status).toBe('warning');
    expect(result.validCount).toBe(1);
    expect(result.errors).toHaveLength(1);
  });
});
