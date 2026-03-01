/**
 * Interface for analytics tracking services.
 *
 * Implementations may send data to Google Analytics, a self-hosted
 * solution, or simply no-op during development.
 */
export interface IAnalyticsService {
  /** Load any required external scripts and configure the provider. */
  initialize(): void;

  /** Record a virtual page view. */
  trackPageView(pageName: string): void;

  /** Record a custom event with optional parameters. */
  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void;

  /**
   * Record an exception. `context` identifies where the error originated
   * (e.g. 'ErrorBoundary', 'PDFRepository', 'unhandledrejection').
   */
  trackException(error: Error, context?: string): void;
}
