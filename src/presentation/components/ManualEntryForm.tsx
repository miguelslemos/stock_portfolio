import { useState, useCallback } from 'react';
import { type ManualEntry } from '@/presentation/hooks/useManualEntries';
import { useAnalytics } from '@/presentation/hooks';
import { CurrencyInput } from './CurrencyInput';

interface ManualEntryFormProps {
  entries: ManualEntry[];
  onAdd: (entry: Omit<ManualEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

interface FormState {
  type: 'vesting' | 'trade';
  date: string;
  quantity: string;
  price: string;
}

const emptyForm: FormState = {
  type: 'vesting',
  date: '',
  quantity: '',
  price: '',
};

export function ManualEntryForm({ entries, onAdd, onRemove, onClear }: ManualEntryFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const analytics = useAnalytics();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!form.date) { setError('Informe a data da operação.'); return; }
      if (!form.quantity || Number(form.quantity) <= 0) { setError('Informe uma quantidade válida.'); return; }
      if (!form.price || Number(form.price) <= 0) { setError('Informe um preço válido.'); return; }

      onAdd({
        type: form.type,
        date: form.date,
        quantity: Math.floor(Number(form.quantity)),
        price: Number(form.price),
      });

      analytics.trackEvent('manual_entry_added', { type: form.type });
      setForm(emptyForm);
    },
    [form, onAdd, analytics]
  );

  return (
    <div className="space-y-5">
      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-700 dark:bg-surface-800">
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Tipo
            </label>
            <div className="flex overflow-hidden rounded-lg border border-surface-200 dark:border-surface-600">
              <button
                type="button"
                aria-pressed={form.type === 'vesting'}
                onClick={() => setForm((f) => ({ ...f, type: 'vesting' }))}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  form.type === 'vesting'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-50 text-surface-600 hover:bg-surface-100 dark:bg-surface-700 dark:text-surface-300'
                }`}
              >
                Vesting
              </button>
              <button
                type="button"
                aria-pressed={form.type === 'trade'}
                onClick={() => setForm((f) => ({ ...f, type: 'trade' }))}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  form.type === 'trade'
                    ? 'bg-rose-500 text-white'
                    : 'bg-surface-50 text-surface-600 hover:bg-surface-100 dark:bg-surface-700 dark:text-surface-300'
                }`}
              >
                Trade
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="entry-date" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Data
            </label>
            <input
              id="entry-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="entry-quantity" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Quantidade
            </label>
            <input
              id="entry-quantity"
              type="number"
              min="1"
              step="1"
              placeholder="100"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="entry-price" className="mb-1 block text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Preço (USD)
            </label>
            <CurrencyInput
              id="entry-price"
              currency="USD"
              placeholder="12.5000"
              value={form.price}
              onChange={(v) => setForm((f) => ({ ...f, price: v }))}
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98]"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-rose-500">{error}</p>
        )}
      </form>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="animate-fade-in rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-800">
          <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3 dark:border-surface-700">
            <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {entries.length} operaç{entries.length === 1 ? 'ão' : 'ões'} adicionada{entries.length === 1 ? '' : 's'}
            </h4>
            <button
              onClick={() => { analytics.trackEvent('manual_entries_cleared', { count: entries.length }); onClear(); }}
              className="text-sm font-medium text-surface-400 transition-colors hover:text-rose-500"
            >
              Remover todas
            </button>
          </div>

          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                    entry.type === 'vesting'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                  }`}
                >
                  {entry.type === 'vesting' ? 'Vesting' : 'Trade'}
                </span>
                <span className="text-sm text-surface-700 dark:text-surface-300">{entry.date}</span>
                <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {entry.type === 'vesting' ? '+' : '-'}{entry.quantity} ações
                </span>
                <span className="text-sm text-surface-500">
                  @ ${entry.price.toFixed(4)}
                </span>
                <button
                  onClick={() => { analytics.trackEvent('manual_entry_removed'); onRemove(entry.id); }}
                  className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  aria-label="Remover operação"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
