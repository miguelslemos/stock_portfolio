interface LoadingStateProps {
  progress: { current: number; total: number; message: string } | null;
}

export function LoadingState({ progress }: LoadingStateProps) {
  const percentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center animate-fade-in">
      {/* Animated spinner */}
      <div className="relative mb-8">
        <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-surface-200 border-t-brand-500 dark:border-surface-700 dark:border-t-brand-400" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-brand-50 dark:bg-brand-950/40" />
        </div>
      </div>

      <p className="mb-1 text-base font-semibold text-surface-800 dark:text-surface-100">
        Processando portfólio
      </p>
      <p className="mb-6 text-sm text-surface-400">
        Buscando cotações PTAX e calculando posições...
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(percentage, 5)}%` }}
          />
        </div>
        {progress && (
          <p className="mt-2 text-sm text-surface-400">
            {progress.message}
          </p>
        )}
      </div>
    </div>
  );
}
