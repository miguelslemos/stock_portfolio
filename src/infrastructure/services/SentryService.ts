import * as Sentry from '@sentry/react';
import { type IAnalyticsService } from '@/application/interfaces';

export class SentryService implements IAnalyticsService {
  private readonly dsn: string;
  private initialized = false;

  constructor(dsn: string) {
    this.dsn = dsn;
  }

  initialize(): void {
    if (this.initialized || !this.dsn) return;

    Sentry.init({
      dsn: this.dsn,
      environment: 'prod',
      sendDefaultPii: false,
      enableLogs: true,

      beforeSendLog: (log) => {
        if (import.meta.env.PROD && (log.level === 'debug' || log.level === 'trace')) {
          return null;
        }
        return log;
      },
    });

    this.initialized = true;
  }

  trackPageView(pageName: string): void {
    if (!this.initialized) return;
    Sentry.logger.info(Sentry.logger.fmt`Page view: ${pageName}`);
  }

  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    Sentry.logger.info(eventName, params);
  }

  trackException(error: Error, context?: string): void {
    if (!this.initialized) return;
    Sentry.captureException(error, {
      extra: context ? { context } : undefined,
    });
  }
}
