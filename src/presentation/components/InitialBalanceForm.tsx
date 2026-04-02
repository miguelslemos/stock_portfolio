import { useCallback } from 'react';
import { type UseInitialBalanceReturn } from '@/presentation/hooks/useInitialBalance';
import { useAnalytics } from '@/presentation/hooks';
import { CurrencyInput } from './CurrencyInput';

interface InitialBalanceFormProps {
  balance: UseInitialBalanceReturn;
}

const lastYear = new Date().getFullYear() - 1;
const exercisibleYears = Array.from({ length: lastYear - 2019 }, (_, i) => lastYear - i);

export function InitialBalanceForm({ balance }: InitialBalanceFormProps) {
  const { state, accumulatedUsd, setEnabled, setField } = balance;
  const analytics = useAnalytics();

  const handleToggle = useCallback(() => {
    const newEnabled = !state.enabled;
    setEnabled(newEnabled);
    analytics.trackEvent('initial_balance_toggled', { enabled: newEnabled });
  }, [state.enabled, setEnabled, analytics]);

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-800">
      {/* Toggle header */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50"
        aria-expanded={state.enabled}
        aria-controls="initial-balance-form"
      >
        {/* Toggle switch */}
        <div
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            state.enabled
              ? 'bg-brand-500 dark:bg-brand-400'
              : 'bg-surface-300 dark:bg-surface-600'
          }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              state.enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>

        <div className="flex-1">
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Informar saldo inicial de um ano anterior
          </span>
          <span className="ml-2 text-sm text-surface-400">Opcional</span>
        </div>

        <svg
          className={`h-4 w-4 text-surface-400 transition-transform duration-200 ${state.enabled ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Collapsible form */}
      <div
        id="initial-balance-form"
        className={`grid transition-all duration-300 ease-in-out ${
          state.enabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-surface-200 px-5 py-5 dark:border-surface-700">
            {/* Info box */}
            <div className="flex items-start gap-3 rounded-lg border border-brand-200/60 bg-brand-50/60 px-4 py-3 dark:border-brand-700/30 dark:bg-brand-950/30">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-sm text-brand-700 dark:text-brand-300">
                Informe a situação do seu portfólio em <strong>31/12/{state.exerciseYear ? Number(state.exerciseYear) - 1 : '____'}</strong>.
                As operações inseridas no sistema devem ser <strong>posteriores</strong> a essa data.
              </p>
            </div>

            {/* Form fields */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Year */}
              <div>
                <label htmlFor="ib-year" className="mb-1 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Ano-Exercício
                  <span className="group relative cursor-help">
                    <svg className="h-3.5 w-3.5 text-surface-400 transition-colors group-hover:text-brand-500 dark:text-surface-500 dark:group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-surface-800 px-3 py-2 text-xs font-normal normal-case tracking-normal text-surface-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-surface-700">
                      O ano em que a declaração é feita.
                      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface-800 dark:border-t-surface-700" />
                    </span>
                  </span>
                </label>
                <select
                  id="ib-year"
                  value={state.exerciseYear}
                  onChange={(e) => setField('exerciseYear', e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
                >
                  <option value="">Selecione o ano</option>
                  {exercisibleYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="ib-quantity" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Quantidade de ações
                </label>
                <input
                  id="ib-quantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="238"
                  value={state.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
                />
              </div>

              {/* Avg Price BRL */}
              <div>
                <label htmlFor="ib-avg-brl" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Preço médio (R$)
                </label>
                <CurrencyInput
                  id="ib-avg-brl"
                  currency="BRL"
                  placeholder="52,3000"
                  value={state.avgPriceBrl}
                  onChange={(v) => setField('avgPriceBrl', v)}
                />
              </div>

              {/* Avg Price USD */}
              <div>
                <label htmlFor="ib-avg-usd" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Preço médio (USD)
                </label>
                <CurrencyInput
                  id="ib-avg-usd"
                  currency="USD"
                  placeholder="10.5000"
                  value={state.avgPriceUsd}
                  onChange={(v) => setField('avgPriceUsd', v)}
                />
              </div>

              {/* Accumulated BRL */}
              <div>
                <label htmlFor="ib-acc-brl" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Acumulado no ano (R$)
                </label>
                <CurrencyInput
                  id="ib-acc-brl"
                  currency="BRL"
                  placeholder="12.447,4032"
                  value={state.accumulatedBrl}
                  onChange={(v) => setField('accumulatedBrl', v)}
                />
              </div>

              {/* Accumulated USD (computed) */}
              <div>
                <label className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                  Acumulado no ano (USD)
                </label>
                <div className="flex h-[38px] items-center rounded-lg border border-surface-200 bg-surface-100 px-3 text-sm text-surface-500 dark:border-surface-600 dark:bg-surface-600 dark:text-surface-300">
                  {accumulatedUsd > 0 ? `$ ${accumulatedUsd.toFixed(4)}` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
