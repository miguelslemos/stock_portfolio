import { useState, useCallback } from 'react';
import { type PortfolioSnapshot } from '@/domain/entities';
import { type YearSummary } from '@/application/services';
import { BRLFormatter, USDFormatter, DateFormatter } from '@/infrastructure/utils/formatters';
import { useAnalytics } from '@/presentation/hooks';
import { Modal, ModalHeader, ModalBody } from './Modal';

interface YearDetailModalProps {
  year: number;
  yearSnapshots: PortfolioSnapshot[];
  summary: YearSummary;
  onClose: () => void;
}

export function YearDetailModal({ year, yearSnapshots, summary, onClose }: YearDetailModalProps) {
  return (
    <Modal onClose={onClose} large>
      <ModalHeader title={`Detalhes do Ano ${year}`} onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          {/* Year-in-progress banner */}
          {summary.yearInProgress && <YearInProgressBanner isCurrentYear={summary.isCurrentYear} />}

          {/* Hero: key numbers at a glance */}
          <HeroSection
            finalQty={summary.finalQty}
            totalCostBrl={summary.totalCostBrl}
            totalProfitLoss={summary.totalProfitLoss}
            yearInProgress={summary.yearInProgress}
            isCurrentYear={summary.isCurrentYear}
            year={year}
          />

          {/* Activity breakdown */}
          <ActivitySection summary={summary} />

          {/* Financial summary (only if trades exist) */}
          {summary.tradeCount > 0 && (
            <FinancialSection
              totalSaleRevenue={summary.totalSaleRevenue}
              totalCostBasis={summary.totalCostBasis}
              totalProfitLoss={summary.totalProfitLoss}
            />
          )}

          {/* Position & pricing */}
          <PositionSection
            finalAvgPriceUsd={summary.finalAvgPriceUsd}
            finalAvgPriceBrl={summary.finalAvgPriceBrl}
            avgPtaxAsk={summary.avgPtaxAsk}
          />

          {/* Operations table */}
          <OperationsTable snapshots={yearSnapshots} />

          {/* Tax summary */}
          <TaxSummary summary={summary} year={year} />
        </div>
      </ModalBody>
    </Modal>
  );
}

/* ================================================================
   Primitives
   ================================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
      {children}
    </h3>
  );
}

function StatCard({
  label,
  value,
  detail,
  variant = 'neutral',
  large,
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: 'positive' | 'negative' | 'neutral';
  large?: boolean;
}) {
  const valueColor =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-surface-900 dark:text-surface-100';

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
      <div className="text-xs text-surface-500 dark:text-surface-400">{label}</div>
      <div className={`font-bold ${valueColor} ${large ? 'text-2xl' : 'text-lg'}`}>{value}</div>
      {detail && <div className="text-xs text-surface-400">{detail}</div>}
    </div>
  );
}

/* ================================================================
   Year-in-progress Banner
   ================================================================ */

function YearInProgressBanner({ isCurrentYear }: { isCurrentYear: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="text-base" aria-hidden="true">{isCurrentYear ? '⏳' : '🔮'}</span>
      <span>
        {isCurrentYear ? (
          <>
            <strong>Ano em andamento.</strong> Os valores refletem as operações até o momento e podem mudar.
          </>
        ) : (
          <>
            <strong>Ano futuro.</strong> As operações mostradas são de um período que ainda não foi encerrado.
          </>
        )}
      </span>
    </div>
  );
}

/* ================================================================
   Hero Section — key numbers at a glance
   ================================================================ */

function HeroSection({
  finalQty,
  totalCostBrl,
  totalProfitLoss,
  yearInProgress,
  isCurrentYear,
  year,
}: {
  finalQty: number;
  totalCostBrl: number;
  totalProfitLoss: number;
  yearInProgress: boolean;
  isCurrentYear: boolean;
  year: number;
}) {
  const qtyLabel = yearInProgress
    ? `Quantidade Atual ${isCurrentYear ? '*' : '**'}`
    : 'Quantidade em Carteira';
  const qtyDetail = yearInProgress
    ? isCurrentYear ? '* Ano em andamento' : '** Ano futuro'
    : `Em 31/12/${year}`;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border-2 border-brand-300 bg-brand-50/60 p-4 dark:border-brand-600 dark:bg-brand-950/30">
        <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{qtyLabel}</div>
        <div className="text-3xl font-bold text-surface-900 dark:text-surface-100">{finalQty}</div>
        <div className="text-xs text-brand-500 dark:text-brand-400">{qtyDetail}</div>
      </div>
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
        <div className="text-xs text-surface-500 dark:text-surface-400">Custo Acumulado no Ano (BRL)</div>
        <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">{BRLFormatter.formatWithPrecision(totalCostBrl)}</div>
        <div className="text-xs text-surface-400">Valor para IRPF</div>
      </div>
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
        <div className="text-xs text-surface-500 dark:text-surface-400">Ganho/Perda Total</div>
        <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {BRLFormatter.format(totalProfitLoss)}
        </div>
        <div className="text-xs text-surface-400">Resultado das vendas</div>
      </div>
    </div>
  );
}

/* ================================================================
   Activity Section — operations overview
   ================================================================ */

function ActivitySection({ summary }: { summary: YearSummary }) {
  return (
    <div>
      <SectionLabel>Atividade do Ano</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de Operações"
          value={String(summary.totalOperations)}
          detail={`${summary.vestingCount} vestings · ${summary.tradeCount} vendas`}
        />
        <StatCard
          label="Ações Recebidas (Vesting)"
          value={`+${summary.totalVested}`}
          detail={`${summary.vestingCount} operações`}
          variant="positive"
        />
        <StatCard
          label="Ações Vendidas"
          value={summary.totalSold > 0 ? `-${summary.totalSold}` : '0'}
          detail={`${summary.tradeCount} operações`}
          variant={summary.totalSold > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="Variação Líquida"
          value={`${summary.netChange >= 0 ? '+' : ''}${summary.netChange}`}
          detail={`${summary.initialQty} → ${summary.finalQty} ações`}
          variant={summary.netChange >= 0 ? 'positive' : 'negative'}
        />
      </div>
    </div>
  );
}

/* ================================================================
   Financial Section — trade P&L breakdown
   ================================================================ */

function FinancialSection({
  totalSaleRevenue,
  totalCostBasis,
  totalProfitLoss,
}: {
  totalSaleRevenue: number;
  totalCostBasis: number;
  totalProfitLoss: number;
}) {
  const isProfit = totalProfitLoss >= 0;

  return (
    <div>
      <SectionLabel>Resultado Financeiro das Vendas</SectionLabel>
      <div
        className={`rounded-xl border-2 p-4 ${
          isProfit
            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-rose-200 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/20'
        }`}
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-surface-500 dark:text-surface-400">Valor das Vendas (BRL)</div>
            <div className="text-lg font-bold text-surface-900 dark:text-surface-100">{BRLFormatter.format(totalSaleRevenue)}</div>
          </div>
          <div>
            <div className="text-xs text-surface-500 dark:text-surface-400">Custo de Aquisição (BRL)</div>
            <div className="text-lg font-bold text-surface-900 dark:text-surface-100">{BRLFormatter.format(totalCostBasis)}</div>
          </div>
          <div>
            <div className="text-xs text-surface-500 dark:text-surface-400">Ganho/Perda de Capital</div>
            <div className={`text-xl font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {BRLFormatter.format(totalProfitLoss)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Position & Pricing Section
   ================================================================ */

function PositionSection({
  finalAvgPriceUsd,
  finalAvgPriceBrl,
  avgPtaxAsk,
}: {
  finalAvgPriceUsd: number;
  finalAvgPriceBrl: number;
  avgPtaxAsk: number;
}) {
  return (
    <div>
      <SectionLabel>Posição e Preços Médios</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Preço Médio Final (USD)"
          value={USDFormatter.formatWithPrecision(finalAvgPriceUsd)}
          detail="Por ação"
        />
        <StatCard
          label="Preço Médio Final (BRL)"
          value={BRLFormatter.formatWithPrecision(finalAvgPriceBrl)}
          detail="Por ação"
        />
        <StatCard
          label="PTAX Média Venda"
          value={BRLFormatter.format(avgPtaxAsk)}
          detail="Média das operações"
        />
      </div>
    </div>
  );
}

/* ================================================================
   Operations Table
   ================================================================ */

function OperationsTable({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  return (
    <div>
      <SectionLabel>Operações do Ano</SectionLabel>
      <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
              <th className="px-4 py-3">Data da Operação</th>
              <th className="px-4 py-3">Operação</th>
              <th className="px-4 py-3 text-right">Qtd.</th>
              <th className="px-4 py-3 text-right">Preço (USD)</th>
              <th className="px-4 py-3 text-right">Qtd. Final</th>
              <th className="px-4 py-3 text-right">P. Médio (USD)</th>
              <th className="px-4 py-3 text-right">P. Médio (BRL)</th>
              <th className="px-4 py-3 text-right">Ganho/Perda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {snapshots.map((snapshot, i) => {
              const { metadata, position } = snapshot;
              const isVesting = metadata.isVesting;
              const profitLoss = snapshot.getOperationProfitLoss();

              return (
                <tr
                  key={i}
                  className="text-surface-700 transition-colors hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800/50"
                >
                  <td className="px-4 py-3 text-surface-900 dark:text-surface-100">
                    {DateFormatter.format(metadata.operationDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isVesting
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {isVesting ? `+${metadata.quantity.value} vesting` : `-${metadata.quantity.value} venda`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {metadata.quantity.value}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {USDFormatter.formatWithPrecision(metadata.pricePerShareUsd.amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-surface-900 dark:text-surface-100">
                    {position.quantity.value}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {BRLFormatter.formatWithPrecision(position.averagePriceBrl.amount)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      profitLoss && profitLoss.amount >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : profitLoss
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-surface-400'
                    }`}
                  >
                    {profitLoss ? BRLFormatter.format(profitLoss.amount) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   Tax Summary — IRPF
   ================================================================ */

function TaxSummary({ summary, year }: { summary: YearSummary; year: number }) {
  const situationLabel = summary.yearInProgress
    ? `Situação Atual ${summary.isCurrentYear ? '*' : '**'}`
    : `Situação 31/12/${year}`;
  const situationDetail = summary.yearInProgress
    ? summary.isCurrentYear ? '* Ano em andamento' : '** Ano futuro'
    : 'Valor para declarar';

  return (
    <div>
      <SectionLabel>Resumo para Imposto de Renda {year + 1}</SectionLabel>

      {/* Key IRPF metrics */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border-2 border-brand-300 bg-brand-50/60 p-4 dark:border-brand-600 dark:bg-brand-950/30">
          <div className="text-xs font-medium text-brand-600 dark:text-brand-400">{situationLabel}</div>
          <div className="text-xl font-bold text-surface-900 dark:text-surface-100">{BRLFormatter.format(summary.totalCostBrl)}</div>
          <div className="text-xs text-brand-500 dark:text-brand-400">{situationDetail}</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
          <div className="text-xs text-surface-500 dark:text-surface-400">Ganho/Perda Total (BRL)</div>
          <div className={`text-xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {BRLFormatter.format(summary.totalProfitLoss)}
          </div>
          <div className="text-xs text-surface-400">Resultado das vendas</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
          <div className="text-xs text-surface-500 dark:text-surface-400">Ações em Carteira</div>
          <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">{summary.finalQty}</div>
          <div className="text-xs text-surface-400">Fim do período</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800">
          <div className="text-xs text-surface-500 dark:text-surface-400">Preço Médio (BRL)</div>
          <div className="text-xl font-bold text-surface-900 dark:text-surface-100">
            {BRLFormatter.formatWithPrecision(summary.finalAvgPriceBrl)}
          </div>
          <div className="text-xs text-surface-400">Por ação</div>
        </div>
      </div>

      {/* IRPF instructions */}
      <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 text-sm dark:border-surface-700 dark:bg-surface-800/50">
        <h4 className="mb-4 font-semibold text-surface-900 dark:text-surface-100">Como Declarar no IRPF</h4>

        <div className="space-y-3 text-surface-700 dark:text-surface-300">
          <IrpfField label="Bens e Direitos" value={summary.irpfBensEDireitos} />
          <IrpfField label="Localização (País)" value={summary.irpfLocalizacao} />
          <IrpfField label="Discriminação" value={summary.irpfDiscriminacao} />
          <IrpfField label="Negociado em bolsa" value={summary.irpfNegociadoEmBolsa} />
          <IrpfField label="Código da Negociação" value={summary.irpfCodigoNegociacao} />
          <IrpfField label={`Situação em 31/12/${year}`} value={summary.irpfSituacao3112} />
          <IrpfField label="Aplicação Financeira - Rendimento ou Perda" value={summary.irpfRendimentoOuPerda} />
          <IrpfField label="Aplicação Financeira - Imposto pago no Exterior" value={summary.irpfImpostoPagoNoExterior} />
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <strong>Atenção:</strong> Este é apenas um resumo das operações. Consulte um contador
          para orientação fiscal precisa e atualizada sobre suas obrigações tributárias.
        </div>
      </div>
    </div>
  );
}

function IrpfField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const analytics = useAnalytics();

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(value);
    analytics.trackEvent('irpf_field_copied', { field: label });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value, label, analytics]);

  return (
    <div
      onClick={handleCopy}
      className="group cursor-pointer rounded-lg bg-surface-100/60 px-3 py-2 transition-colors hover:bg-surface-200/80 dark:bg-surface-700/40 dark:hover:bg-surface-600/40"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-surface-500 dark:text-surface-400">{label}</div>
        <span className={`text-xs font-medium transition-opacity ${copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400'}`}>
          {copied ? (
            'Copiado!'
          ) : (
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
          )}
        </span>
      </div>
      <div className="text-sm text-surface-800 dark:text-surface-200">{value}</div>
    </div>
  );
}
