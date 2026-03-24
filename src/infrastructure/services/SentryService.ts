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

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });

    this.initialized = true;
  }

  trackPageView(pageName: string): void {
    if (!this.initialized) return;
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page view: ${pageName}`,
      level: 'info',
    });
  }

  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    Sentry.addBreadcrumb({
      category: 'ui',
      message: eventName,
      data: params,
      level: 'info',
    });
  }

  trackException(error: Error, context?: string): void {
    if (!this.initialized) return;
    Sentry.captureException(error, {
      extra: context ? { context } : undefined,
    });
  }
}
