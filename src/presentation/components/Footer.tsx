export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50 px-6 py-8 dark:border-surface-800 dark:bg-surface-900">
      {/* Disclaimer */}
      <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-amber-400/20 bg-amber-50/50 p-5 dark:border-amber-500/10 dark:bg-amber-500/5">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
            <p className="font-semibold text-surface-800 dark:text-surface-200">Aviso Legal</p>
            <p className="mt-1">
              Ferramenta auxiliar e educacional. Os cálculos não substituem orientação profissional.{' '}
              <strong className="text-surface-700 dark:text-surface-300">
                Consulte um contador qualificado
              </strong>{' '}
              para declaração de IRPF.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="text-center text-xs text-surface-400 dark:text-surface-500">
        <p>
          <span className="font-semibold text-surface-600 dark:text-surface-300">Stock Portfolio Manager</span>
          {' · '}Código aberto
        </p>
        <p className="mt-1.5">
          <a
            href="https://github.com/miguelslemos/stock_portfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-500 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
