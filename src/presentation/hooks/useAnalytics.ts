import { createContext, useContext, useEffect, useMemo, createElement, type ReactNode } from 'react';
import { type IAnalyticsService } from '@/application/interfaces';
import { GoogleAnalyticsService } from '@/infrastructure/services/GoogleAnalyticsService';
import { NoOpAnalyticsService } from '@/infrastructure/services/NoOpAnalyticsService';

const AnalyticsContext = createContext<IAnalyticsService | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const service = useMemo<IAnalyticsService>(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
    if (measurementId) {
      return new GoogleAnalyticsService(measurementId);
    }
    return new NoOpAnalyticsService();
  }, []);

  useEffect(() => {
    service.initialize();
  }, [service]);

  return createElement(AnalyticsContext.Provider, { value: service }, children);
}

export function useAnalytics(): IAnalyticsService {
  const service = useContext(AnalyticsContext);
  if (!service) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return service;
}
