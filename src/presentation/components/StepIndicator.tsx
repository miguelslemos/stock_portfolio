interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { label: 'Selecione fontes', desc: 'PDFs, JSON ou entrada manual' },
  { label: 'Processe', desc: 'Cálculo automático com PTAX' },
  { label: 'Veja resultados', desc: 'Relatórios e IRPF' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="flex flex-1 items-center gap-2">
            {/* Step circle + text */}
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                    : isActive
                      ? 'bg-brand-600 text-white dark:bg-brand-500'
                      : 'bg-surface-200 text-surface-400 dark:bg-surface-700 dark:text-surface-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <div className="hidden sm:block">
                <div className={`text-sm font-semibold ${isActive ? 'text-brand-700 dark:text-brand-300' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-surface-400 dark:text-surface-500'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-surface-400">{step.desc}</div>
              </div>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={`mx-1 h-px flex-1 transition-colors ${isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-surface-200 dark:bg-surface-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
