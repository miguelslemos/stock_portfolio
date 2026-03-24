import { type IAnalyticsService } from '@/application/interfaces';

/**
 * Delegates every call to multiple analytics services.
 * Allows GA, Sentry, and any future provider to run side by side.
 */
export class CompositeAnalyticsService implements IAnalyticsService {
  constructor(private readonly services: IAnalyticsService[]) {}

  initialize(): void {
    for (const s of this.services) s.initialize();
  }

  trackPageView(pageName: string): void {
    for (const s of this.services) s.trackPageView(pageName);
  }

  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    for (const s of this.services) s.trackEvent(eventName, params);
  }

  trackException(error: Error, context?: string): void {
    for (const s of this.services) s.trackException(error, context);
  }
}
