import { useState, useCallback } from 'react';

export interface ManualEntry {
  id: string;
  type: 'vesting' | 'trade';
  date: string;
  quantity: number;
  price: number;
  settlementDate?: string;
}

interface UseManualEntriesReturn {
  entries: ManualEntry[];
  addEntry: (entry: Omit<ManualEntry, 'id'>) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
  toJSON: () => string;
  hasEntries: boolean;
}

let entryCounter = 0;

export function useManualEntries(): UseManualEntriesReturn {
  const [entries, setEntries] = useState<ManualEntry[]>([]);

  const addEntry = useCallback((entry: Omit<ManualEntry, 'id'>) => {
    entryCounter++;
    const newEntry: ManualEntry = { ...entry, id: `manual-${entryCounter}-${Date.now()}` };
    setEntries((prev) => [...prev, newEntry]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const toJSON = useCallback((): string => {
    return JSON.stringify(
      entries.map((e) => ({
        type: e.type,
        date: e.date,
        quantity: e.quantity,
        price: e.price,
        ...(e.type === 'trade' && e.settlementDate ? { settlement_date: e.settlementDate } : {}),
      }))
    );
  }, [entries]);

  return {
    entries,
    addEntry,
    removeEntry,
    clearEntries,
    toJSON,
    hasEntries: entries.length > 0,
  };
}
