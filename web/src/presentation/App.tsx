import { useState, useCallback } from 'react';
import { usePortfolio, useFileUpload, useDarkMode, useManualEntries } from './hooks';
import {
  Header,
  Footer,
  InputMethodSelector,
  type InputMethod,
  ManualEntryForm,
  PdfUploadPanel,
  JsonUploadPanel,
  HelpSection,
  LoadingState,
  ResultsSection,
} from './components';

export function App() {
  const portfolio = usePortfolio();
  const fileUpload = useFileUpload();
  const manualEntries = useManualEntries();
  const { isDark, toggle: toggleTheme } = useDarkMode();
  const [activeMethods, setActiveMethods] = useState<Set<InputMethod>>(new Set(['manual']));

  const toggleMethod = useCallback((method: InputMethod) => {
    setActiveMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) {
        next.delete(method);
      } else {
        next.add(method);
      }
      return next;
    });
  }, []);

  const hasData =
    (activeMethods.has('manual') && manualEntries.hasEntries) ||
    (activeMethods.has('json') && fileUpload.files.jsonFile !== null) ||
    (activeMethods.has('pdf') && (fileUpload.files.tradePDFs.length > 0 || fileUpload.files.releasePDFs.length > 0));

  const handleProcess = useCallback(
    (exportData = false) => {
      void portfolio.processPortfolio({
        tradePDFs: activeMethods.has('pdf') ? fileUpload.files.tradePDFs : [],
        releasePDFs: activeMethods.has('pdf') ? fileUpload.files.releasePDFs : [],
        jsonFile: activeMethods.has('json') ? fileUpload.files.jsonFile : null,
        manualEntriesJSON: activeMethods.has('manual') && manualEntries.hasEntries ? manualEntries.toJSON() : null,
        exportData,
      });
    },
    [portfolio, activeMethods, fileUpload.files, manualEntries]
  );

  const handleDemo = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch('/demo-data.json');
        const json = await res.text();
        void portfolio.processPortfolio({
          tradePDFs: [],
          releasePDFs: [],
          jsonFile: null,
          manualEntriesJSON: json,
          exportData: false,
        });
      } catch {
        // If fetch fails, try inline
        void portfolio.processPortfolio({
          tradePDFs: [],
          releasePDFs: [],
          jsonFile: null,
          manualEntriesJSON: null,
          exportData: false,
        });
      }
    })();
  }, [portfolio]);

  const handleReset = useCallback(() => {
    portfolio.reset();
    fileUpload.clearAll();
    manualEntries.clearEntries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [portfolio, fileUpload, manualEntries]);

  const isIdle = portfolio.state.status === 'idle';
  const isLoading = portfolio.state.status === 'loading';
  const isSuccess = portfolio.state.status === 'success';
  const isError = portfolio.state.status === 'error';

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-surface-200/50 bg-surface-0 shadow-xl dark:border-surface-800 dark:bg-surface-900">
      <Header isDark={isDark} onToggleTheme={toggleTheme} />

      <main>
        {/* ===== Input section (idle/error) ===== */}
        {(isIdle || isError) && (
          <div className="space-y-6 px-6 py-8 sm:px-10">
            {/* Section title + Demo CTA */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                  Carregar Operações
                </h2>
                <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  Selecione uma ou mais fontes de dados. Elas serão combinadas automaticamente.
                </p>
              </div>

              {/* Demo button */}
              <button
                onClick={handleDemo}
                disabled={isLoading}
                className="group flex shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-100 hover:shadow-sm active:scale-[0.98] disabled:opacity-40 dark:border-brand-600 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:border-brand-500 dark:hover:bg-brand-900/40"
              >
                <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Carregar com dados de demonstração
              </button>
            </div>

            {/* Method selector (multi-select) */}
            <InputMethodSelector selected={activeMethods} onToggle={toggleMethod} />

            {/* Panels: show all that are active */}
            {activeMethods.has('manual') && (
              <ManualEntryForm
                entries={manualEntries.entries}
                onAdd={manualEntries.addEntry}
                onRemove={manualEntries.removeEntry}
                onClear={manualEntries.clearEntries}
              />
            )}

            {activeMethods.has('json') && <JsonUploadPanel fileUpload={fileUpload} />}

            {activeMethods.has('pdf') && (
              <>
                <PdfUploadPanel fileUpload={fileUpload} />
                <HelpSection />
              </>
            )}

            {/* Error message */}
            {isError && portfolio.state.error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-500/20 dark:bg-rose-500/5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-rose-700 dark:text-rose-400">
                  <strong>Erro:</strong> {portfolio.state.error}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-surface-200 pt-6 dark:border-surface-700">
              <button
                onClick={() => handleProcess(false)}
                disabled={!hasData || isLoading}
                className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Processar Portfólio
              </button>
              <button
                onClick={() => handleProcess(true)}
                disabled={!hasData || isLoading}
                className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-900/40"
              >
                Processar e Exportar CSV
              </button>
            </div>
          </div>
        )}

        {/* ===== Loading ===== */}
        {isLoading && <LoadingState progress={portfolio.state.progress} />}

        {/* ===== Results ===== */}
        {isSuccess && portfolio.state.response && (
          <ResultsSection
            response={portfolio.state.response}
            snapshots={portfolio.state.snapshots}
            onReset={handleReset}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
