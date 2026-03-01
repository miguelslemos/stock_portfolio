export type InputMethod = 'manual' | 'json' | 'pdf';

interface InputMethodSelectorProps {
  selected: Set<InputMethod>;
  onToggle: (method: InputMethod) => void;
}

const methods: { id: InputMethod; label: string; desc: string; badge?: string }[] = [
  { id: 'manual', label: 'Entrada Manual', desc: 'Adicione operações uma a uma' },
  { id: 'json', label: 'Arquivo JSON', desc: 'Importe de um arquivo .json' },
  { id: 'pdf', label: 'PDFs do E*Trade', desc: 'Leitura automática dos PDFs', badge: 'Recomendado' },
];

export function InputMethodSelector({ selected, onToggle }: InputMethodSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {methods.map((m) => {
        const isActive = selected.has(m.id);
        return (
          <button
            key={m.id}
            onClick={() => onToggle(m.id)}
            className={`group relative rounded-xl border-2 px-4 py-4 text-left transition-all ${
              isActive
                ? 'border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400 dark:bg-brand-950/40'
                : 'border-surface-200 bg-surface-0 hover:border-surface-300 hover:shadow-sm dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600'
            }`}
          >
            {m.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                {m.badge}
              </span>
            )}

            {/* Checkbox */}
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                  isActive
                    ? 'border-brand-500 bg-brand-500 dark:border-brand-400 dark:bg-brand-400'
                    : 'border-surface-300 dark:border-surface-500'
                }`}
              >
                {isActive && (
                  <svg className="h-3 w-3 text-white dark:text-surface-900" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm font-semibold ${
                  isActive ? 'text-brand-700 dark:text-brand-300' : 'text-surface-700 dark:text-surface-200'
                }`}
              >
                {m.label}
              </span>
            </div>

            <p className="pl-6 text-sm text-surface-500 dark:text-surface-400">{m.desc}</p>
          </button>
        );
      })}

      {selected.size > 1 && (
        <div className="sm:col-span-3">
          <p className="text-center text-sm text-brand-600 dark:text-brand-400">
            As fontes selecionadas serão combinadas automaticamente ao processar.
          </p>
        </div>
      )}
    </div>
  );
}
