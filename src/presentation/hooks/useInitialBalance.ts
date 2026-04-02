import { useState, useCallback, useMemo } from 'react';
import { PortfolioPosition, Money, StockQuantity, ProfitLoss } from '@/domain/entities';

export interface InitialBalanceState {
  enabled: boolean;
  exerciseYear: string;
  quantity: string;
  avgPriceBrl: string;
  avgPriceUsd: string;
  accumulatedBrl: string;
}

export interface UseInitialBalanceReturn {
  state: InitialBalanceState;
  accumulatedUsd: number;
  isValid: boolean;
  setEnabled: (enabled: boolean) => void;
  setField: (field: keyof Omit<InitialBalanceState, 'enabled'>, value: string) => void;
  toPortfolioPosition: () => PortfolioPosition | null;
  reset: () => void;
}

const INITIAL_STATE: InitialBalanceState = {
  enabled: false,
  exerciseYear: '',
  quantity: '',
  avgPriceBrl: '',
  avgPriceUsd: '',
  accumulatedBrl: '',
};

export function useInitialBalance(): UseInitialBalanceReturn {
  const [state, setState] = useState<InitialBalanceState>(INITIAL_STATE);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, enabled }));
  }, []);

  const setField = useCallback(
    (field: keyof Omit<InitialBalanceState, 'enabled'>, value: string) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const accumulatedUsd = useMemo(() => {
    const qty = Number(state.quantity);
    const priceUsd = Number(state.avgPriceUsd);
    if (!isFinite(qty) || !isFinite(priceUsd) || qty <= 0 || priceUsd <= 0) return 0;
    return qty * priceUsd;
  }, [state.quantity, state.avgPriceUsd]);

  const isValid = useMemo(() => {
    if (!state.enabled) return true;
    const year = Number(state.exerciseYear);
    const qty = Number(state.quantity);
    const avgBrl = Number(state.avgPriceBrl);
    const avgUsd = Number(state.avgPriceUsd);
    const accBrl = Number(state.accumulatedBrl);
    return (
      year >= 2000 && year <= new Date().getFullYear() &&
      qty > 0 && Number.isInteger(qty) &&
      avgBrl > 0 &&
      avgUsd > 0 &&
      accBrl > 0
    );
  }, [state]);

  const toPortfolioPosition = useCallback((): PortfolioPosition | null => {
    if (!state.enabled) return null;

    const calendarYear = Number(state.exerciseYear) - 1;
    const qty = Number(state.quantity);
    const avgUsd = Number(state.avgPriceUsd);
    const accBrl = Number(state.accumulatedBrl);

    if (!isValid) return null;

    return new PortfolioPosition(
      new StockQuantity(qty),
      new Money(avgUsd * qty, 'USD'),
      new Money(accBrl, 'BRL'),
      new Money(avgUsd, 'USD'),
      new ProfitLoss(0, 'BRL'),
      new Date(calendarYear, 11, 31)
    );
  }, [state, isValid]);

  return {
    state,
    accumulatedUsd,
    isValid,
    setEnabled,
    setField,
    toPortfolioPosition,
    reset,
  };
}
