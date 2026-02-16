import { type IAnalyticsService } from '@/application/interfaces';

/**
 * No-op implementation used when no analytics Measurement ID is
 * configured or during local development.  Every method is a silent
 * no-op so components can call the analytics API unconditionally.
 */
export class NoOpAnalyticsService implements IAnalyticsService {
  initialize(): void {
    /* no-op */
  }

  trackPageView(_pageName: string): void {
    /* no-op */
  }

  trackEvent(_eventName: string, _params?: Record<string, string | number | boolean>): void {
    /* no-op */
  }
}
