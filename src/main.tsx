import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './presentation/App';
import { AnalyticsProvider } from './presentation/hooks';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

async function getRootOptions(): Promise<Record<string, unknown>> {
  if (!import.meta.env.VITE_SENTRY_DSN) return {};

  const { reactErrorHandler } = await import('@sentry/react');
  return {
    onUncaughtError: reactErrorHandler(),
    onCaughtError: reactErrorHandler(),
    onRecoverableError: reactErrorHandler(),
  };
}

void getRootOptions().then((options) => {
  createRoot(rootElement, options).render(
    <StrictMode>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </StrictMode>
  );
});
