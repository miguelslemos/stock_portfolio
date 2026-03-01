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
              { label: 'Selecione arquivos individuais ou uma pasta inteira (aceita subpastas)' },
            ]}
            gifSrc="./download-release-confirmation.gif"
            gifAlt="Demo de download de release"
          />

          <InstructionCard
            icon="📉"
            title="PDFs de Confirmação de Venda (Trade)"
            steps={[
              { label: 'Acesse E*TRADE Documents', url: 'https://us.etrade.com/etx/pxy/accountdocs-statements#/documents' },
              { label: 'Baixe os PDFs de Trade dos anos desejados' },
              { label: 'Selecione arquivos individuais ou uma pasta separada' },
            ]}
            gifSrc="./download-trade-confirmation.gif"
            gifAlt="Demo de download de trade"
          />
        </div>

        <div className="mt-4 rounded-xl border border-brand-300/60 bg-brand-50 p-4 dark:border-brand-700/40 dark:bg-brand-950/40">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Dicas</p>
          </div>
          <ul className="space-y-2">
            {[
              { icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3', text: 'Pode selecionar arquivos individuais ou uma pasta inteira, use o que for mais conveniente' },
              { icon: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z', text: 'Ao selecionar uma pasta, subpastas são processadas automaticamente.' },
              { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z', text: 'Nomes de arquivo não importam apenas o conteúdo interno do PDF é analisado' },
              { icon: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636', text: 'Se não tiver vendas no período, deixe o campo de Trade sem arquivos' },
            ].map(({ icon, text }, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">{text}</span>
              </li>
            ))}
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
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm text-surface-600 dark:text-surface-400">
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
