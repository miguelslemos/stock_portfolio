import { type ProcessPortfolioResponse } from '@/application/usecases';
import { type PortfolioSnapshot } from '@/domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from '@/presentation/formatters';
import { useAnalytics } from '@/presentation/hooks';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { OperationDetailModal } from './OperationDetailModal';
import { YearDetailModal } from './YearDetailModal';

interface ResultsSectionProps {
  response: ProcessPortfolioResponse;
  snapshots: PortfolioSnapshot[];
  onReset: () => void;
}

export function ResultsSection({ response, snapshots, onReset }: ResultsSectionProps) {
  const { finalPosition, totalOperations } = response;
  const analytics = useAnalytics();

  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    analytics.trackPageView('results');
  }, [analytics]);

  const handleYearClick = useCallback((year: number) => {
    analytics.trackEvent('year_detail_viewed', { year });
    setSelectedYear(year);
  }, [analytics]);

  const handleOperationClick = useCallback((index: number) => {
    const operationType = snapshots[index]?.getOperationDescription() ?? 'unknown';
    analytics.trackEvent('operation_detail_viewed', { operation_type: operationType, index });
    setSelectedOperation(index);
  }, [analytics, snapshots]);

  const yearlySnapshots = useMemo(() => getYearlySnapshots(snapshots), [snapshots]);
  const sortedYears = useMemo(
    () => Array.from(yearlySnapshots.keys()).sort((a, b) => a - b),
    [yearlySnapshots]
  );

  // Sum gross profit across all years (each year's profit is reset independently)
  const totalReturnAllYears = useMemo(() => {
    let total = 0;
    for (const snapshot of yearlySnapshots.values()) {
      total += snapshot.position.grossProfitBrl.amount;
    }
    return total;
  }, [yearlySnapshots]);

  return (
    <div className="animate-slide-up space-y-6 px-6 py-8 sm:px-10">
      {/* Reset CTA */}
      <button
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-500/30 dark:hover:bg-brand-950/20 dark:hover:text-brand-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        Processar novos dados
      </button>

      {/* Summary cards */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-surface-900 dark:text-surface-100">Resumo do Portfólio</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total de Operações" value={String(totalOperations)} />
          <StatCard label="Posição Atual" value={`${finalPosition.quantity.value} ações`} />
          <StatCard label="Preço Médio (USD)" value={USDFormatter.format(finalPosition.averagePriceUsd.amount)} />
          <StatCard
            label="Retorno Total (BRL)"
            value={BRLFormatter.format(totalReturnAllYears)}
            variant={totalReturnAllYears >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      {/* Yearly table */}
      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Resumo Anual</h2>
          <span className="text-sm text-surface-400">Clique para detalhes</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                <th className="px-4 py-3">Ano</th>
                <th className="px-4 py-3">Qtd.</th>
                <th className="px-4 py-3">Custo Acumulado (USD)</th>
                <th className="px-4 py-3">Preço Médio (USD)</th>
                <th className="px-4 py-3">Acumulado no Ano (BRL)</th>
                <th className="px-4 py-3">Preço Médio (BRL)</th>
                <th className="px-4 py-3">Ganho/Perda Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {sortedYears.map((year) => {
                const snapshot = yearlySnapshots.get(year)!;
                const pos = snapshot.position;
                const isCurrentYear = year === new Date().getFullYear();
                return (
                  <tr
                    key={year}
                    onClick={() => handleYearClick(year)}
                    className={`cursor-pointer transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/20 ${
                      isCurrentYear
                        ? 'bg-amber-50/40 text-surface-700 dark:bg-amber-950/10 dark:text-surface-300'
                        : 'text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-surface-900 dark:text-surface-100">
                      {year}
                      {isCurrentYear && (
                        <span className="ml-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">*</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{pos.quantity.value}</td>
                    <td className="px-4 py-3">{USDFormatter.format(pos.totalCostUsd.amount)}</td>
                    <td className="px-4 py-3">{USDFormatter.formatWithPrecision(pos.averagePriceUsd.amount)}</td>
                    <td className="px-4 py-3">{BRLFormatter.format(pos.totalCostBrl.amount)}</td>
                    <td className="px-4 py-3">{BRLFormatter.formatWithPrecision(pos.averagePriceBrl.amount)}</td>
                    <td className={`px-4 py-3 font-medium ${pos.grossProfitBrl.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {BRLFormatter.format(pos.grossProfitBrl.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedYears.includes(new Date().getFullYear()) && (
          <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400">* Ano em andamento — valores parciais</p>
        )}
      </div>

      {/* Operations table */}
      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Histórico de Operações</h2>
          <span className="text-sm text-surface-400">Clique para detalhes</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-400">
                <th className="px-4 py-3">Data da Operação</th>
                <th className="px-4 py-3">Operação</th>
                <th className="px-4 py-3">Qtd. Final</th>
                <th className="px-4 py-3">Preço Médio (USD)</th>
                <th className="px-4 py-3">Preço Médio (BRL)</th>
                <th className="px-4 py-3">Ganho/Perda Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {snapshots.map((snapshot, index) => {
                const pos = snapshot.position;
                const meta = snapshot.metadata;
                return (
                  <tr
                    key={index}
                    onClick={() => handleOperationClick(index)}
                    className="cursor-pointer text-surface-700 transition-colors hover:bg-brand-50/50 dark:text-surface-300 dark:hover:bg-brand-950/20"
                  >
                    <td className="px-4 py-3">{DateFormatter.format(meta.operationDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        meta.isVesting
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}>
                        {snapshot.getOperationDescription()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{pos.quantity.value}</td>
                    <td className="px-4 py-3">{USDFormatter.formatWithPrecision(pos.averagePriceUsd.amount)}</td>
                    <td className="px-4 py-3">{BRLFormatter.formatWithPrecision(pos.averagePriceBrl.amount)}</td>
                    <td className={`px-4 py-3 font-medium ${pos.grossProfitBrl.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {BRLFormatter.format(pos.grossProfitBrl.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedOperation !== null && snapshots[selectedOperation] && (
        <OperationDetailModal snapshot={snapshots[selectedOperation]} onClose={() => setSelectedOperation(null)} />
      )}
      {selectedYear !== null && (
        <YearDetailModal
          year={selectedYear}
          yearSnapshots={snapshots.filter((s) => s.position.lastUpdated.getFullYear() === selectedYear)}
          onClose={() => setSelectedYear(null)}
        />
      )}
    </div>
  );
}

/* ===== StatCard ===== */

function StatCard({ label, value, variant = 'neutral' }: { label: string; value: string; variant?: 'positive' | 'negative' | 'neutral' }) {
  const valueColor =
    variant === 'positive' ? 'text-emerald-600 dark:text-emerald-400'
    : variant === 'negative' ? 'text-rose-600 dark:text-rose-400'
    : 'text-surface-900 dark:text-surface-100';

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 transition-shadow hover:shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-400">{label}</p>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

/* ===== Helpers ===== */

function getYearlySnapshots(snapshots: PortfolioSnapshot[]): Map<number, PortfolioSnapshot> {
  const yearlyMap = new Map<number, PortfolioSnapshot>();
  for (const snapshot of snapshots) {
    const year = snapshot.position.lastUpdated.getFullYear();
    const existing = yearlyMap.get(year);
    if (!existing || snapshot.position.lastUpdated >= existing.position.lastUpdated) {
      yearlyMap.set(year, snapshot);
    }
  }
  return yearlyMap;
}
