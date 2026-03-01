import { type IAnalyticsService } from '@/application/interfaces';

interface GtagFunction {
  (command: 'js', date: Date): void;
  (command: 'config', targetId: string, config?: Record<string, unknown>): void;
  (command: 'event', eventName: string, params?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFunction;
  }
}

export class GoogleAnalyticsService implements IAnalyticsService {
  private readonly measurementId: string;
  private initialized = false;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  initialize(): void {
    if (this.initialized || !this.measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag() works by forwarding the Arguments object to dataLayer
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    } as GtagFunction;

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      send_page_view: false,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    this.initialized = true;
  }

  trackPageView(pageName: string): void {
    if (!this.initialized) return;
    window.gtag('event', 'page_view', { page_title: pageName });
  }

  trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    window.gtag('event', eventName, params);
  }

  trackException(error: Error, context?: string): void {
    if (!this.initialized) return;
    const description = context
      ? `[${context}] ${error.name}: ${error.message}`
      : `${error.name}: ${error.message}`;
    window.gtag('event', 'exception', { description, fatal: false });
  }
}
