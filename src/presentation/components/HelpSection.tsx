import { useState, useCallback } from 'react';
import { useAnalytics } from '@/presentation/hooks';

export function HelpSection() {
  const [isOpen, setIsOpen] = useState(true);
  const analytics = useAnalytics();

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      analytics.trackEvent('help_section_opened');
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, analytics]);

  return (
    <div className="animate-fade-in">
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-3 rounded-xl border border-surface-200 bg-surface-0 px-5 py-4 text-left transition-all hover:shadow-sm dark:border-surface-700 dark:bg-surface-800"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/40">
          <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <span className="flex-1">
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Como obter os PDFs do E*Trade?
          </span>
          <span className="ml-2 text-xs text-surface-400">Instruções passo a passo</span>
        </span>
        <svg
          className={`h-4 w-4 text-surface-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'mt-4 max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InstructionCard
            icon="📈"
            title="PDFs de Confirmação de Vesting (Release)"
            steps={[
              { label: 'Acesse o E*TRADE Stock Plan', url: 'https://us.etrade.com/etx/sp/stockplan/#/myAccount/stockPlanConfirmations' },
              { label: 'Baixe os PDFs de Release dos anos desejados' },
              { label: 'Organize em uma pasta (aceita subpastas)' },
            ]}
            gifSrc="../docs/gif/download-release-confirmation.gif"
            gifAlt="Demo de download de release"
          />

          <InstructionCard
            icon="📉"
            title="PDFs de Confirmação de Venda (Trade)"
            steps={[
              { label: 'Acesse E*TRADE Documents', url: 'https://us.etrade.com/etx/pxy/accountdocs-statements#/documents' },
              { label: 'Baixe os PDFs de Trade dos anos desejados' },
              { label: 'Organize em uma pasta separada' },
            ]}
            gifSrc="../docs/gif/download-trade-confirmation.gif"
            gifAlt="Demo de download de trade"
          />
        </div>

        <div className="mt-4 rounded-xl border border-brand-200/50 bg-brand-50/50 p-4 dark:border-brand-900/30 dark:bg-brand-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400">Dicas</p>
          <ul className="mt-2 space-y-1 text-xs text-surface-600 dark:text-surface-400">
            <li>Organize por ano — crie subpastas (2023/, 2024/)</li>
            <li>O sistema processa PDFs recursivamente em todas subpastas</li>
            <li>Nomes de arquivo não importam — o conteúdo do PDF é analisado</li>
            <li>Se não tiver vendas, deixe o campo de Trade vazio</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InstructionCard({
  icon,
  title,
  steps,
  gifSrc,
  gifAlt,
}: {
  icon: string;
  title: string;
  steps: { label: string; url?: string }[];
  gifSrc: string;
  gifAlt: string;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-700 dark:bg-surface-800">
      <h4 className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-100">
        {icon} {title}
      </h4>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-xs text-surface-600 dark:text-surface-400">
              {step.url ? (
                <a href={step.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 dark:text-brand-400">
                  {step.label}
                </a>
              ) : (
                step.label
              )}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-3 overflow-hidden rounded-lg border border-surface-200 dark:border-surface-600">
        <img src={gifSrc} alt={gifAlt} loading="lazy" className="w-full" />
      </div>
    </div>
  );
}
