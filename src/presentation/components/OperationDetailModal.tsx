import { type PortfolioSnapshot, type PortfolioPosition, type OperationMetadata } from '@/domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from '@/presentation/formatters';
import { Modal, ModalHeader, ModalBody } from './Modal';

interface OperationDetailModalProps {
  snapshot: PortfolioSnapshot;
  onClose: () => void;
}

export function OperationDetailModal({ snapshot, onClose }: OperationDetailModalProps) {
  const { position, metadata, previousPosition } = snapshot;
  const isVesting = metadata.isVesting;
  const ptaxBid = metadata.exchangeRates.ptaxBid;
  const ptaxAsk = metadata.exchangeRates.ptaxAsk;

  const prev = previousPosition ?? position;

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Detalhes da Operação" onClose={onClose} />
      <ModalBody>
        <div className="space-y-5">
          {/* Hero: operation type + key figures */}
          <OperationHero metadata={metadata} isVesting={isVesting} />

          {/* This operation's cost */}
          <OperationCost metadata={metadata} isVesting={isVesting} ptaxBid={ptaxBid} />

          {/* Before / After comparison */}
          <BeforeAfterSection
            before={prev}
            after={position}
            isVesting={isVesting}
          />

          {/* Trade-specific: sale values + P&L */}
          {metadata.isTrade && (
            <TradeSection snapshot={snapshot} ptaxAsk={ptaxAsk} />
          )}

          {/* Formulas */}
          <FormulasSection snapshot={snapshot} previousPosition={prev} />
        </div>
      </ModalBody>
    </Modal>
  );
}

/* ================================================================
   Primitives
   ================================================================ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
      {children}
    </h3>
  );
}

function MetricCard({
  label,
  value,
  detail,
  variant = 'neutral',
  large,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
  variant?: 'positive' | 'negative' | 'neutral' | 'muted';
  large?: boolean;
}) {
  const valueColor =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : variant === 'muted'
          ? 'text-surface-400 dark:text-surface-500'
          : 'text-surface-900 dark:text-surface-100';

  return (
    <div>
      <div className="text-xs text-surface-400">{label}</div>
      <div className={`font-semibold ${valueColor} ${large ? 'text-lg' : 'text-sm'}`}>
        {value}
      </div>
      {detail && <div className="text-xs text-surface-400">{detail}</div>}
    </div>
  );
}

function FormulaBlock({ label, expression }: { label: string; expression: string }) {
  return (
    <div className="rounded-lg bg-surface-50 px-4 py-2.5 text-xs dark:bg-surface-800">
      <div className="mb-0.5 font-medium text-surface-500 dark:text-surface-400">{label}</div>
      <div className="font-mono text-surface-600 dark:text-surface-300">{expression}</div>
    </div>
  );
}

/* ================================================================
   1. Operation Hero
   ================================================================ */

function OperationHero({
  metadata,
  isVesting,
}: {
  metadata: OperationMetadata;
  isVesting: boolean;
}) {
  const qty = metadata.quantity.value;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: badge + dates */}
      <div className="space-y-1">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            isVesting
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
          }`}
        >
          {isVesting ? 'Vesting' : 'Trade (Venda)'}
        </span>
        <div className="text-xs text-surface-400">
          {DateFormatter.formatLong(metadata.operationDate)}
          {metadata.settlementDate.getTime() !== metadata.operationDate.getTime() && (
            <span> &middot; Liquidação {DateFormatter.format(metadata.settlementDate)}</span>
          )}
        </div>
      </div>

      {/* Right: quantity + price */}
      <div className="flex items-baseline gap-3">
        <span
          className={`text-2xl font-bold ${
            isVesting
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {isVesting ? '+' : '-'}{qty}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   2. Operation Cost
   ================================================================ */

function OperationCost({
  metadata,
  isVesting,
  ptaxBid,
}: {
  metadata: OperationMetadata;
  isVesting: boolean;
  ptaxBid: number;
}) {
  const qty = metadata.quantity.value;
  const priceUsd = metadata.pricePerShareUsd.amount;
  const totalUsd = metadata.totalCostUsd.amount;
  const totalBrl = metadata.totalCostBrl.amount;

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800/50">
      <SectionTitle>{isVesting ? 'Custo da Aquisição' : 'Custo de Aquisição da Venda'}</SectionTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Preço Unitário (USD)"
          value={USDFormatter.format(priceUsd)}
        />
        <MetricCard
          label="PTAX Venda"
          value={BRLFormatter.format(ptaxBid)}
          detail={DateFormatter.format(metadata.settlementDate)}
        />
        <MetricCard
          label={`Total USD (${qty} ações)`}
          value={USDFormatter.format(totalUsd)}
        />
        <MetricCard
          label="Total BRL"
          value={BRLFormatter.format(totalBrl)}
          detail={`${qty} × ${USDFormatter.format(priceUsd)} × ${BRLFormatter.format(ptaxBid)}`}
          large
        />
      </div>
    </div>
  );
}

/* ================================================================
   3. Before / After Comparison
   ================================================================ */

function BeforeAfterSection({
  before,
  after,
  isVesting,
}: {
  before: PortfolioPosition;
  after: PortfolioPosition;
  isVesting: boolean;
}) {
  return (
    <div>
      <SectionTitle>Impacto no Portfólio</SectionTitle>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-3">
        {/* BEFORE card */}
        <PositionCard
          label="Antes"
          position={before}
          dimmed
        />

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isVesting
              ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'
              : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
          }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* AFTER card */}
        <PositionCard
          label="Depois"
          position={after}
          highlighted
        />
      </div>

      {/* Delta row */}
      <DeltaRow before={before} after={after} />
    </div>
  );
}

function PositionCard({
  label,
  position,
  dimmed,
  highlighted,
}: {
  label: string;
  position: PortfolioPosition;
  dimmed?: boolean;
  highlighted?: boolean;
}) {
  const borderClass = highlighted
    ? 'border-brand-300 dark:border-brand-600'
    : 'border-surface-200 dark:border-surface-700';

  const bgClass = highlighted
    ? 'bg-brand-50/50 dark:bg-brand-950/20'
    : 'bg-surface-50/50 dark:bg-surface-800/30';

  const textVariant = dimmed ? 'muted' as const : 'neutral' as const;

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${borderClass} ${bgClass}`}>
      <div className={`mb-3 text-xs font-semibold uppercase tracking-widest ${
        dimmed ? 'text-surface-400' : 'text-brand-600 dark:text-brand-400'
      }`}>
        {label}
      </div>
      <div className="space-y-2.5">
        <MetricCard
          label="Ações"
          value={position.quantity.value}
          variant={textVariant}
          large
        />
        <MetricCard
          label="Preço Médio (USD)"
          value={USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}
          variant={textVariant}
        />
        <MetricCard
          label="Preço Médio (BRL)"
          value={BRLFormatter.formatWithPrecision(position.averagePriceBrl.amount)}
          variant={textVariant}
        />
        <MetricCard
          label="Custo Acumulado (BRL)"
          value={BRLFormatter.format(position.totalCostBrl.amount)}
          detail="Soma de todas as aquisições"
          variant={textVariant}
        />
      </div>
    </div>
  );
}

function DeltaRow({
  before,
  after,
}: {
  before: PortfolioPosition;
  after: PortfolioPosition;
}) {
  const qtyDelta = after.quantity.value - before.quantity.value;
  const pmUsdDelta = after.averagePriceUsd.amount - before.averagePriceUsd.amount;
  const pmBrlDelta = after.averagePriceBrl.amount - before.averagePriceBrl.amount;
  const costBrlDelta = after.totalCostBrl.amount - before.totalCostBrl.amount;

  return (
    <div className="mt-2 rounded-lg bg-surface-50 px-4 py-2.5 dark:bg-surface-800">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-surface-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
        </svg>
        Variação com esta operação
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <DeltaItem label="Ações" value={qtyDelta} format="qty" />
        <DeltaItem label="Preço Médio (USD)" value={pmUsdDelta} format="usd" />
        <DeltaItem label="Preço Médio (BRL)" value={pmBrlDelta} format="brl" />
        <DeltaItem label="Custo (BRL)" value={costBrlDelta} format="brl" />
      </div>
    </div>
  );
}

function DeltaItem({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format: 'qty' | 'usd' | 'brl';
}) {
  const isZero = Math.abs(value) < 0.0001;
  const isPositive = value > 0;
  const isNegative = value < 0;

  const valueColor = isZero
    ? 'text-surface-300 dark:text-surface-600'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : isNegative
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-surface-400';

  const labelColor = isZero
    ? 'text-surface-300 dark:text-surface-600'
    : 'text-surface-400';

  const sign = isPositive ? '+' : '';
  let formatted: string;
  if (format === 'qty') {
    formatted = isZero ? '0' : `${sign}${value}`;
  } else if (format === 'usd') {
    formatted = isZero ? '$0.00' : `${sign}${USDFormatter.formatWithPrecision(value)}`;
  } else {
    formatted = isZero ? 'R$ 0,00' : `${sign}${BRLFormatter.formatWithPrecision(value)}`;
  }

  return (
    <div>
      <div className={`text-xs ${labelColor}`}>{label}</div>
      <div className={`font-semibold ${valueColor}`}>{formatted}</div>
    </div>
  );
}

/* ================================================================
   4. Trade Section (sale values + P&L)
   ================================================================ */

function TradeSection({
  snapshot,
  ptaxAsk,
}: {
  snapshot: PortfolioSnapshot;
  ptaxAsk: number;
}) {
  const tradeFinancials = snapshot.metadata.tradeFinancials;
  const previousPosition = snapshot.previousPosition;
  if (!tradeFinancials || !previousPosition) return null;

  const operationQty = snapshot.metadata.quantity.value;
  const liquidationPrice = snapshot.metadata.pricePerShareUsd.amount;
  const pmBrl = previousPosition.averagePriceBrl.amount;
  const ganhoCapital =
    snapshot.position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount;
  const isProfit = ganhoCapital >= 0;

  // Formula breakdown:
  // Valor da Venda     = qty × preço USD × PTAX venda
  // Custo de Aquisição = qty × PM BRL (acumulado)
  // Ganho              = Valor da Venda - Custo de Aquisição
  const receitaStr = `${operationQty} × ${USDFormatter.formatWithPrecision(liquidationPrice)} × ${ptaxAsk.toFixed(4)}`;
  const custoStr = `${operationQty} × ${BRLFormatter.formatWithPrecision(pmBrl)}`;

  return (
    <div className="space-y-4">
      {/* Sale revenue */}
      <div className="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-700 dark:bg-surface-800/50">
        <SectionTitle>Valores da Venda</SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            label="Preço de Liquidação"
            value={USDFormatter.formatWithPrecision(liquidationPrice)}
          />
          <MetricCard
            label="PTAX Venda"
            value={ptaxAsk.toFixed(4)}
          />
          <MetricCard
            label={`Valor da Venda (USD)`}
            value={USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)}
          />
          <MetricCard
            label="Valor da Venda (BRL)"
            value={BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)}
            large
          />
        </div>
      </div>

      {/* Profit / Loss highlight */}
      <div
        className={`rounded-xl border-2 p-4 ${
          isProfit
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20'
        }`}
      >
        <SectionTitle>Resultado da Operação</SectionTitle>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Valor da Venda (BRL)"
            value={BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)}
            detail={receitaStr}
          />
          <MetricCard
            label="Custo de Aquisição (BRL)"
            value={BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}
            detail={custoStr}
          />
          <MetricCard
            label="Ganho/Perda de Capital"
            value={BRLFormatter.format(ganhoCapital)}
            variant={isProfit ? 'positive' : 'negative'}
            large
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   5. Formulas (explanation)
   ================================================================ */

function FormulasSection({
  snapshot,
  previousPosition,
}: {
  snapshot: PortfolioSnapshot;
  previousPosition: PortfolioPosition;
}) {
  const { position, metadata } = snapshot;
  const isVesting = metadata.isVesting;
  const isTrade = metadata.isTrade;

  if (position.isEmpty && !isTrade) return null;

  const costBrlDelta = position.totalCostBrl.amount - previousPosition.totalCostBrl.amount;
  const costBrlBefore = previousPosition.totalCostBrl.amount;
  const costBrlAfter = position.totalCostBrl.amount;

  // Trade-specific: capital gain formula data
  const tradeFinancials = metadata.tradeFinancials;
  const ganhoCapital = isTrade
    ? position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount
    : 0;

  return (
    <div>
      <SectionTitle>Como Calculamos</SectionTitle>
      <div className="space-y-2">
        {!position.isEmpty && (
          <>
            <FormulaBlock
              label="Preço Médio USD = Custo Acumulado USD ÷ Quantidade"
              expression={`${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)} = ${USDFormatter.format(position.totalCostUsd.amount)} ÷ ${position.quantity.value}`}
            />
            <FormulaBlock
              label="Preço Médio BRL = Custo Acumulado BRL ÷ Quantidade"
              expression={`${BRLFormatter.formatWithPrecision(position.averagePriceBrl.amount)} = ${BRLFormatter.format(position.totalCostBrl.amount)} ÷ ${position.quantity.value}`}
            />
          </>
        )}
        <FormulaBlock
          label="Variação Custo BRL = Custo Acumulado BRL (depois) − Custo Acumulado BRL (antes)"
          expression={`${BRLFormatter.format(costBrlDelta)} = ${BRLFormatter.format(costBrlAfter)} − ${BRLFormatter.format(costBrlBefore)}`}
        />
        {isTrade && tradeFinancials && (
          <FormulaBlock
            label="Ganho/Perda de Capital = Valor da Venda BRL − Custo de Aquisição BRL"
            expression={`${BRLFormatter.format(ganhoCapital)} = ${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} - ${BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}`}
          />
        )}
        <div className="mt-1 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
          O Custo Acumulado é a soma em reais de todas as suas aquisições, onde cada compra foi convertida pela PTAX do dia da liquidação. Ele representa quanto você investiu no total até o momento.
        </div>
        {isVesting && (
          <div className="mt-1 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
            O preço médio em BRL reflete o custo real acumulado, não uma simples conversão do preço médio em USD.
          </div>
        )}
      </div>
    </div>
  );
}
