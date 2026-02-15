import { type PortfolioSnapshot } from '@/domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from '@/presentation/formatters';
import { Modal, ModalHeader, ModalBody } from './Modal';

interface YearDetailModalProps {
  year: number;
  yearSnapshots: PortfolioSnapshot[];
  onClose: () => void;
}

export function YearDetailModal({ year, yearSnapshots, onClose }: YearDetailModalProps) {
  const firstSnapshot = yearSnapshots[0];
  const lastSnapshot = yearSnapshots[yearSnapshots.length - 1];

  if (!firstSnapshot || !lastSnapshot) return null;

  const finalPosition = lastSnapshot.position;
  const initialPosition = firstSnapshot.previousPosition;

  const vestings = yearSnapshots.filter((s) => s.metadata.isVesting);
  const trades = yearSnapshots.filter((s) => s.metadata.isTrade);

  const totalVested = vestings.reduce((sum, s) => sum + s.metadata.quantity.value, 0);
  const totalSold = trades.reduce((sum, s) => sum + s.metadata.quantity.value, 0);

  const totalProfitLoss = trades.reduce(
    (sum, s) => sum + (s.metadata.tradeFinancials?.profitLossBrl.amount ?? 0),
    0
  );

  const avgPtaxBid =
    yearSnapshots.reduce((sum, s) => sum + s.metadata.exchangeRates.ptaxBid, 0) /
    yearSnapshots.length;
  const avgPtaxAsk =
    yearSnapshots.reduce((sum, s) => sum + s.metadata.exchangeRates.ptaxAsk, 0) /
    yearSnapshots.length;

  const initialQty = initialPosition?.quantity.value ?? 0;
  const finalQty = finalPosition.quantity.value;
  const netChange = finalQty - initialQty;
  const ptaxBid = lastSnapshot.metadata.exchangeRates.ptaxBid;

  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;
  const isFutureYear = year > currentYear;
  const yearInProgress = isCurrentYear || isFutureYear;

  return (
    <Modal onClose={onClose} large>
      <ModalHeader title={`📅 Detalhes do Ano ${year}`} onClose={onClose} />
      <ModalBody>
        <div className="space-y-8">
          {/* Year summary */}
          <YearSummary
            year={year}
            snapshots={yearSnapshots}
            vestings={vestings}
            trades={trades}
            totalVested={totalVested}
            totalSold={totalSold}
            totalProfitLoss={totalProfitLoss}
            avgPtaxBid={avgPtaxBid}
            avgPtaxAsk={avgPtaxAsk}
            initialQty={initialQty}
            finalQty={finalQty}
            netChange={netChange}
            ptaxBid={ptaxBid}
            finalPosition={lastSnapshot.position}
            yearInProgress={yearInProgress}
            isCurrentYear={isCurrentYear}
          />

          {/* Operations table */}
          <OperationsTable snapshots={yearSnapshots} />

          {/* Tax summary */}
          <TaxSummary
            year={year}
            yearSnapshots={yearSnapshots}
            totalProfitLoss={totalProfitLoss}
            yearInProgress={yearInProgress}
            isCurrentYear={isCurrentYear}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}

/* ===== Year Summary ===== */

function YearSummary({
  year,
  snapshots,
  vestings,
  trades,
  totalVested,
  totalSold,
  totalProfitLoss,
  avgPtaxBid,
  avgPtaxAsk,
  initialQty,
  finalQty,
  netChange,
  ptaxBid,
  finalPosition,
  yearInProgress,
  isCurrentYear,
}: {
  year: number;
  snapshots: PortfolioSnapshot[];
  vestings: PortfolioSnapshot[];
  trades: PortfolioSnapshot[];
  totalVested: number;
  totalSold: number;
  totalProfitLoss: number;
  avgPtaxBid: number;
  avgPtaxAsk: number;
  initialQty: number;
  finalQty: number;
  netChange: number;
  ptaxBid: number;
  finalPosition: PortfolioSnapshot['position'];
  yearInProgress: boolean;
  isCurrentYear: boolean;
}) {
  const yearEndQtyLabel = yearInProgress
    ? `Quantidade Atual ${isCurrentYear ? '*' : '**'}`
    : 'Quantidade no Fim do Ano';

  const yearEndQtyDetail = yearInProgress
    ? isCurrentYear
      ? '* Ano em andamento'
      : '** Ano futuro'
    : `Em 31/12/${year}`;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500">
        Resumo do Ano {year}
      </h3>

      {yearInProgress && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm">
          <span aria-hidden="true">{isCurrentYear ? '⏳' : '🔮'}</span>
          <span>
            {isCurrentYear ? (
              <>
                <strong>Ano em andamento:</strong> Os valores mostrados refletem as operações até o
                momento. Novas operações podem alterar os resultados.
              </>
            ) : (
              <>
                <strong>Ano futuro:</strong> As operações mostradas são de um ano que ainda não
                começou ou está em andamento.
              </>
            )}
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SummaryCard label="Total de Operações" value={String(snapshots.length)} detail={`${vestings.length} vestings • ${trades.length} vendas`} />
        <SummaryCard label="Ações Recebidas (Vesting)" value={`+${totalVested}`} detail={`${vestings.length} operações`} variant="positive" />
        <SummaryCard label="Ações Vendidas" value={`-${totalSold}`} detail={`${trades.length} operações`} variant={totalSold > 0 ? 'negative' : 'neutral'} />
        <SummaryCard label="Variação Líquida" value={`${netChange >= 0 ? '+' : ''}${netChange}`} detail={`${initialQty} → ${finalQty} ações`} variant={netChange >= 0 ? 'positive' : 'negative'} />
        <SummaryCard label={yearEndQtyLabel} value={String(finalQty)} detail={yearEndQtyDetail} highlight={yearInProgress} large />
        <SummaryCard label="Total de Vendas" value={String(trades.length)} detail="Operações de venda" />
        <SummaryCard
          label="Total Vendido (BRL)"
          value={BRLFormatter.format(
            trades.reduce((sum, t) => sum + (t.metadata.tradeFinancials?.saleRevenueBrl.amount ?? 0), 0)
          )}
          detail="Valor bruto de vendas"
        />
        <SummaryCard
          label="Custo Total das Vendas (BRL)"
          value={BRLFormatter.format(
            trades.reduce((sum, t) => sum + (t.metadata.tradeFinancials?.costBasisBrl.amount ?? 0), 0)
          )}
          detail="Base de custo"
        />
        <SummaryCard
          label="Lucro/Prejuízo Total"
          value={BRLFormatter.format(totalProfitLoss)}
          detail="Resultado das vendas"
          variant={totalProfitLoss >= 0 ? 'positive' : 'negative'}
        />
        <SummaryCard label="PTAX Média Compra" value={avgPtaxBid.toFixed(4)} detail="Média das operações" />
        <SummaryCard label="PTAX Média Venda" value={avgPtaxAsk.toFixed(4)} detail="Média das operações" />
        <SummaryCard
          label="Preço Médio Final (USD)"
          value={USDFormatter.formatWithPrecision(finalPosition.averagePriceUsd.amount)}
          detail="Por ação"
        />
        <SummaryCard
          label="Preço Médio Final (BRL)"
          value={BRLFormatter.formatWithPrecision(finalPosition.averagePriceBrl(ptaxBid).amount)}
          detail="Por ação"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  variant = 'neutral',
  highlight,
  large,
}: {
  label: string;
  value: string;
  detail: string;
  variant?: 'positive' | 'negative' | 'neutral';
  highlight?: boolean;
  large?: boolean;
}) {
  const valueColor =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-surface-900';

  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-brand-300 bg-brand-50'
          : 'border-surface-200 bg-white'
      }`}
    >
      <div className="text-xs text-surface-500">{label}</div>
      <div className={`font-bold ${valueColor} ${large ? 'text-2xl' : 'text-lg'}`}>{value}</div>
      <div className="text-xs text-surface-400">{detail}</div>
    </div>
  );
}

/* ===== Operations Table ===== */

function OperationsTable({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500">
        Operações do Ano
      </h3>
      <div className="overflow-x-auto rounded-xl border border-surface-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Operação</th>
              <th className="px-4 py-3">Qtd. Op.</th>
              <th className="px-4 py-3">Preço (USD)</th>
              <th className="px-4 py-3">Qtd. Final</th>
              <th className="px-4 py-3">Preço Médio (USD)</th>
              <th className="px-4 py-3">Preço Médio (BRL)</th>
              <th className="px-4 py-3">Lucro/Prejuízo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {snapshots.map((snapshot, i) => {
              const { metadata, position } = snapshot;
              const ptaxBid = metadata.exchangeRates.ptaxBid;
              const profitLoss = snapshot.getOperationProfitLoss();

              return (
                <tr key={i} className="hover:bg-surface-50">
                  <td className="px-4 py-3">{DateFormatter.format(metadata.operationDate)}</td>
                  <td className="px-4 py-3">{snapshot.getOperationDescription()}</td>
                  <td className="px-4 py-3">{metadata.quantity.value}</td>
                  <td className="px-4 py-3">
                    {USDFormatter.formatWithPrecision(metadata.pricePerShareUsd.amount)}
                  </td>
                  <td className="px-4 py-3">{position.quantity.value}</td>
                  <td className="px-4 py-3">
                    {USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {BRLFormatter.formatWithPrecision(position.averagePriceBrl(ptaxBid).amount)}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      profitLoss && profitLoss.amount >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : profitLoss
                          ? 'text-rose-600 dark:text-rose-400'
                          : ''
                    }`}
                  >
                    {profitLoss ? BRLFormatter.format(profitLoss.amount) : '-'}
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

/* ===== Tax Summary ===== */

function TaxSummary({
  year,
  yearSnapshots,
  totalProfitLoss,
  yearInProgress,
  isCurrentYear,
}: {
  year: number;
  yearSnapshots: PortfolioSnapshot[];
  totalProfitLoss: number;
  yearInProgress: boolean;
  isCurrentYear: boolean;
}) {
  const lastSnapshot = yearSnapshots[yearSnapshots.length - 1];
  const finalPosition = lastSnapshot?.position;
  const totalCostBrl = finalPosition?.totalCostBrl.amount ?? 0;
  const totalCostUsd = finalPosition?.totalCostUsd.amount ?? 0;
  const ptaxBid = lastSnapshot?.metadata.exchangeRates.ptaxBid ?? 0;
  const finalQty = finalPosition?.quantity.value ?? 0;
  const avgPriceBrl = finalPosition ? finalPosition.averagePriceBrl(ptaxBid).amount : 0;
  const avgPriceUsd = finalPosition ? finalPosition.averagePriceUsd.amount : 0;

  const situationLabel = yearInProgress
    ? `Situação Atual ${isCurrentYear ? '*' : '**'}`
    : `Situação 31/12/${year}`;

  const situationDetail = yearInProgress
    ? isCurrentYear
      ? '* Ano em andamento'
      : '** Ano futuro'
    : 'Valor para declarar';

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-surface-500">
        💰 Resumo para Imposto de Renda {year}
      </h3>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-300 bg-brand-50 p-4">
          <div className="text-xs text-surface-500">{situationLabel}</div>
          <div className="text-xl font-bold text-surface-900">{BRLFormatter.format(totalCostBrl)}</div>
          <div className="text-xs text-surface-400">{situationDetail}</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <div className="text-xs text-surface-500">Lucro/Prejuízo Total (BRL)</div>
          <div
            className={`text-xl font-bold ${
              totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {BRLFormatter.format(totalProfitLoss)}
          </div>
          <div className="text-xs text-surface-400">Resultado das vendas</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <div className="text-xs text-surface-500">Quantidade de Ações Fim do Ano</div>
          <div className="text-2xl font-bold text-surface-900">{finalQty}</div>
          <div className="text-xs text-surface-400">Ações em carteira</div>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <div className="text-xs text-surface-500">Preço Médio (BRL)</div>
          <div className="text-xl font-bold text-surface-900">
            {BRLFormatter.formatWithPrecision(avgPriceBrl)}
          </div>
          <div className="text-xs text-surface-400">Por ação</div>
        </div>
      </div>

      {/* IRPF instructions */}
      <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 text-sm">
        <h4 className="mb-3 font-semibold text-surface-900">ℹ️ Como Declarar no IRPF:</h4>
        <ul className="space-y-2 text-surface-700">
          <li>
            <strong>Bens e Direitos:</strong> Grupo 03 - Participações em sociedades, Código 01 -
            Ações (inclusive as listadas em bolsa)
          </li>
          <li>
            <strong>Localização(País):</strong> 137 - Cayman, Ilhas
          </li>
          <li>
            <strong>Discriminação:</strong> NU - {finalQty} Acoes da empresa Nu Holdings Ltd.
            negociadas na Bolsa do pais Estados Unidos através do codigo: NU, adquiridas pela
            corretora ETrade. Valor de custo em {USDFormatter.format(totalCostUsd)} ou{' '}
            {BRLFormatter.format(totalCostBrl)} com preço médio de{' '}
            {USDFormatter.formatWithPrecision(avgPriceUsd)} ou{' '}
            {BRLFormatter.formatWithPrecision(avgPriceBrl)} por ação. Corretora: ETrade
          </li>
          <li>
            <strong>Negociado em bolsa:</strong> Sim
          </li>
          <li>
            <strong>Código da Negociação:</strong> NU
          </li>
          <li>
            <strong>Situação em 31/12/{year}:</strong> {BRLFormatter.format(totalCostBrl)}
          </li>
          <li>
            <strong>Aplicação Financeira/Lucro ou Prejuízo:</strong>{' '}
            {BRLFormatter.format(totalProfitLoss)}
          </li>
        </ul>
        <p className="mt-4 text-xs text-surface-500">
          ⚠️ <strong>Atenção:</strong> Este é apenas um resumo das operações. Consulte um contador
          para orientação fiscal precisa e atualizada sobre suas obrigações tributárias.
        </p>
      </div>
    </div>
  );
}
