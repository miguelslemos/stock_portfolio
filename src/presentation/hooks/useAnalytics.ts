import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  createElement,
  type ReactNode,
} from 'react';
import { type IAnalyticsService } from '@/application/interfaces';
import { GoogleAnalyticsService } from '@/infrastructure/services/GoogleAnalyticsService';
import { SentryService } from '@/infrastructure/services/SentryService';
import { CompositeAnalyticsService } from '@/infrastructure/services/CompositeAnalyticsService';
import { NoOpAnalyticsService } from '@/infrastructure/services/NoOpAnalyticsService';

const AnalyticsContext = createContext<IAnalyticsService | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

function createAnalyticsService(): IAnalyticsService {
  const services: IAnalyticsService[] = [];

  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaMeasurementId) {
    services.push(new GoogleAnalyticsService(gaMeasurementId));
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    services.push(new SentryService(sentryDsn));
  }

  if (services.length === 0) return new NoOpAnalyticsService();
  if (services.length === 1) return services[0]!;
  return new CompositeAnalyticsService(services);
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const service = useMemo<IAnalyticsService>(createAnalyticsService, []);

  useEffect(() => {
    service.initialize();

    const handleWindowError = (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      service.trackException(error, 'window.onerror');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      service.trackException(error, 'unhandledrejection');
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
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
