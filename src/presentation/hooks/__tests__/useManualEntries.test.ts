// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useManualEntries } from '../useManualEntries';

const VESTING = { type: 'vesting' as const, date: '01/15/2023', quantity: 100, price: 10 };
const TRADE = { type: 'trade' as const, date: '06/10/2023', quantity: 50, price: 15, settlementDate: '06/12/2023' };

describe('useManualEntries', () => {
  it('starts with empty entries', () => {
    const { result } = renderHook(() => useManualEntries());
    expect(result.current.entries).toHaveLength(0);
    expect(result.current.hasEntries).toBe(false);
  });

  it('adds an entry and sets hasEntries', () => {
    const { result } = renderHook(() => useManualEntries());
    act(() => result.current.addEntry(VESTING));
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.hasEntries).toBe(true);
  });

  it('assigns a unique id to each entry via crypto.randomUUID', () => {
    const { result } = renderHook(() => useManualEntries());
    act(() => {
      result.current.addEntry(VESTING);
      result.current.addEntry(VESTING);
    });
    const [a, b] = result.current.entries;
    expect(a!.id).not.toBe(b!.id);
  });

  it('removes an entry by id', () => {
    const { result } = renderHook(() => useManualEntries());
    act(() => result.current.addEntry(VESTING));
    const id = result.current.entries[0]!.id;
    act(() => result.current.removeEntry(id));
    expect(result.current.entries).toHaveLength(0);
  });

  it('clears all entries', () => {
    const { result } = renderHook(() => useManualEntries());
    act(() => {
      result.current.addEntry(VESTING);
      result.current.addEntry(TRADE);
    });
    act(() => result.current.clearEntries());
    expect(result.current.entries).toHaveLength(0);
    expect(result.current.hasEntries).toBe(false);
  });

  describe('toJSON', () => {
    it('serializes vesting correctly', () => {
      const { result } = renderHook(() => useManualEntries());
      act(() => result.current.addEntry(VESTING));
      const parsed = JSON.parse(result.current.toJSON()) as unknown[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({ type: 'vesting', quantity: 100, price: 10 });
    });

    it('serializes trade with settlement_date (snake_case)', () => {
      const { result } = renderHook(() => useManualEntries());
      act(() => result.current.addEntry(TRADE));
      const parsed = JSON.parse(result.current.toJSON()) as unknown[];
      expect(parsed[0]).toMatchObject({
        type: 'trade',
        settlement_date: '06/12/2023',
      });
    });

    it('omits settlement_date for vesting', () => {
      const { result } = renderHook(() => useManualEntries());
      act(() => result.current.addEntry(VESTING));
      const parsed = JSON.parse(result.current.toJSON()) as Record<string, unknown>[];
      expect(parsed[0]).not.toHaveProperty('settlement_date');
    });

    it('returns empty array JSON for no entries', () => {
      const { result } = renderHook(() => useManualEntries());
      expect(result.current.toJSON()).toBe('[]');
    });
  });
});
