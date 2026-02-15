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
  const operationQty = metadata.quantity.value;
  const previousQty = previousPosition?.quantity.value ?? 0;
  const ptaxBid = metadata.exchangeRates.ptaxBid;
  const ptaxAsk = metadata.exchangeRates.ptaxAsk;

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="📋 Detalhes da Operação" onClose={onClose} />
      <ModalBody>
        <div className="space-y-6">
          <GeneralInfo metadata={metadata} operationQty={operationQty} isVesting={isVesting} />
          <PortfolioPositionSection position={position} previousQty={previousQty} />
          <AveragePrices position={position} ptaxBid={ptaxBid} />
          {metadata.isTrade && <TradeDetails snapshot={snapshot} ptaxAsk={ptaxAsk} />}
          {metadata.isTrade && (
            <ProfitLossSection snapshot={snapshot} previousPosition={previousPosition} />
          )}
          <DescriptionSection
            snapshot={snapshot}
            previousQty={previousQty}
            ptaxBid={ptaxBid}
            ptaxAsk={ptaxAsk}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}

/* ===== Sub-sections ===== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-surface-400">{children}</h3>;
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function DetailItem({ label, value, large }: { label: string; value: React.ReactNode; large?: boolean }) {
  return (
    <div>
      <div className="text-xs text-surface-400">{label}</div>
      <div className={`font-semibold text-surface-900 dark:text-surface-100 ${large ? 'text-xl' : 'text-sm'}`}>{value}</div>
    </div>
  );
}

function Formula({ formula, result }: { formula: string; result: string }) {
  return (
    <div className="mt-3 rounded-lg bg-surface-50 px-4 py-2.5 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-400">
      <div className="mb-1 font-medium text-surface-500 dark:text-surface-400">{formula}</div>
      {result}
    </div>
  );
}

function GeneralInfo({
  metadata,
  operationQty,
  isVesting,
}: {
  metadata: OperationMetadata;
  operationQty: number;
  isVesting: boolean;
}) {
  return (
    <div>
      <SectionTitle>Informações Gerais</SectionTitle>
      <DetailGrid>
        <DetailItem
          label="Tipo de Operação"
          value={
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                isVesting ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              {isVesting ? '📈 Vesting' : '📉 Trade (Venda)'}
            </span>
          }
        />
        <DetailItem label="Data da Operação" value={DateFormatter.formatLong(metadata.operationDate)} />
        <DetailItem
          label="Data da Liquidação"
          value={DateFormatter.formatLong(metadata.settlementDate)}
        />
        <DetailItem
          label="Quantidade da Operação"
          value={`${isVesting ? '+' : '-'}${operationQty}`}
          large
        />
      </DetailGrid>
    </div>
  );
}

function PortfolioPositionSection({
  position,
  previousQty,
}: {
  position: PortfolioPosition;
  previousQty: number;
}) {
  return (
    <div>
      <SectionTitle>Posição do Portfólio</SectionTitle>
      <DetailGrid>
        <DetailItem label="Ações Antes" value={previousQty} />
        <DetailItem label="Ações Após" value={position.quantity.value} large />
      </DetailGrid>
    </div>
  );
}

function AveragePrices({
  position,
  ptaxBid,
}: {
  position: PortfolioPosition;
  ptaxBid: number;
}) {
  return (
    <div>
      <SectionTitle>Preços Médios</SectionTitle>
      <DetailGrid>
        <DetailItem
          label="Preço Médio (USD)"
          value={USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}
        />
        <DetailItem
          label="Preço Médio (BRL)"
          value={BRLFormatter.formatWithPrecision(position.averagePriceBrl(ptaxBid).amount)}
        />
        <DetailItem label="PTAX Compra" value={BRLFormatter.formatWithPrecision(ptaxBid)} />
      </DetailGrid>
      <Formula
        formula="Preço Médio BRL = Preço Médio USD × PTAX Compra"
        result={`${BRLFormatter.formatWithPrecision(position.averagePriceBrl(ptaxBid).amount)} = ${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)} × ${ptaxBid.toFixed(6)}`}
      />
    </div>
  );
}

function TradeDetails({
  snapshot,
  ptaxAsk,
}: {
  snapshot: PortfolioSnapshot;
  ptaxAsk: number;
}) {
  const tradeFinancials = snapshot.metadata.tradeFinancials;
  if (!tradeFinancials) return null;

  const liquidationPrice = snapshot.metadata.pricePerShareUsd.amount;
  const operationQty = snapshot.metadata.quantity.value;

  return (
    <div>
      <SectionTitle>Valores da Venda</SectionTitle>
      <DetailGrid>
        <DetailItem
          label="Preço de Liquidação (USD)"
          value={USDFormatter.formatWithPrecision(liquidationPrice)}
        />
        <DetailItem
          label="Total Liquidado (USD)"
          value={USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)}
        />
        <DetailItem
          label="Total Liquidado (BRL)"
          value={BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)}
        />
        <DetailItem label="PTAX Venda" value={BRLFormatter.formatWithPrecision(ptaxAsk)} />
      </DetailGrid>
      <Formula
        formula="Total Liquidado USD = Preço de Liquidação × Quantidade"
        result={`${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} = ${USDFormatter.formatWithPrecision(liquidationPrice)} × ${operationQty}`}
      />
      <Formula
        formula="Liquidado BRL = Liquidado USD × PTAX Venda"
        result={`${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} = ${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} × ${ptaxAsk.toFixed(6)}`}
      />
    </div>
  );
}

function ProfitLossSection({
  snapshot,
  previousPosition,
}: {
  snapshot: PortfolioSnapshot;
  previousPosition: PortfolioPosition | null;
}) {
  const tradeFinancials = snapshot.metadata.tradeFinancials;
  if (!tradeFinancials || !previousPosition) return null;

  const ganhoCapital =
    snapshot.position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount;

  return (
    <div>
      <SectionTitle>Lucro/Prejuízo</SectionTitle>
      <DetailGrid>
        <DetailItem
          label="Custo Base (BRL)"
          value={BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}
        />
        <DetailItem
          label="Ganho de Capital"
          value={
            <span className={ganhoCapital >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {BRLFormatter.format(ganhoCapital)}
            </span>
          }
        />
      </DetailGrid>
      <Formula
        formula="Ganho de Capital = Liquidado BRL - Custo Base BRL"
        result={`${BRLFormatter.format(ganhoCapital)} = ${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} - ${BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}`}
      />
    </div>
  );
}

function DescriptionSection({
  snapshot,
  previousQty,
  ptaxBid,
  ptaxAsk,
}: {
  snapshot: PortfolioSnapshot;
  previousQty: number;
  ptaxBid: number;
  ptaxAsk: number;
}) {
  const { position, metadata, previousPosition } = snapshot;
  const isVesting = metadata.isVesting;
  const operationQty = metadata.quantity.value;
  const settlementDate = DateFormatter.format(metadata.settlementDate);

  if (isVesting) {
    const custoUnitarioUsd = metadata.pricePerShareUsd.amount;
    const custoTotalUsd = metadata.totalCostUsd.amount;
    const custoTotalBrl = metadata.totalCostBrl.amount;

    return (
      <div>
        <SectionTitle>Descrição da Operação</SectionTitle>
        <div className="rounded-lg bg-surface-50 p-4 text-sm leading-relaxed text-surface-700 dark:bg-surface-800 dark:text-surface-300">
          <strong>Operação de Vesting em NU</strong>
          <br /><br />
          Em <strong>{settlementDate}</strong>, foram adicionadas{' '}
          <strong>{operationQty} ações</strong> ao portfólio através de vesting.
          <br /><br />
          <strong>Custo da operação:</strong>
          <br />
          • Valor unitário: {USDFormatter.formatWithPrecision(custoUnitarioUsd)}
          <br />
          • Custo total: {USDFormatter.format(custoTotalUsd)} ={' '}
          {BRLFormatter.format(custoTotalBrl)} (PTAX Compra{' '}
          {BRLFormatter.formatWithPrecision(ptaxBid)})
          <br /><br />
          <strong>Impacto no portfólio:</strong>
          <br />
          • Ações antes: {previousQty}
          <br />
          • Ações adicionadas: +{operationQty}
          <br />
          • Ações após: <strong>{position.quantity.value}</strong>
          <br />
          • Novo preço médio:{' '}
          {USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)} (
          {BRLFormatter.formatWithPrecision(position.averagePriceBrl(ptaxBid).amount)})
          <br />
          • Custo total acumulado: {BRLFormatter.format(position.totalCostBrl.amount)}
        </div>
      </div>
    );
  }

  // Trade description
  const tradeFinancials = metadata.tradeFinancials;
  if (!tradeFinancials || !previousPosition) return null;

  const ganhoCapital = position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount;
  const precoCustoUnitario = previousPosition.averagePriceUsd.amount;
  const precoVendaUnitario = metadata.pricePerShareUsd.amount;
  const lucroUnitarioUsd = precoVendaUnitario - precoCustoUnitario;

  return (
    <div>
      <SectionTitle>Descrição da Operação</SectionTitle>
      <div className="rounded-lg bg-surface-50 p-4 text-sm leading-relaxed text-surface-700 dark:bg-surface-800 dark:text-surface-300">
        <strong>Operação Encerrada em NU</strong>
        <br /><br />
        Em <strong>{settlementDate}</strong>, o ganho de capital foi de{' '}
        <strong className={ganhoCapital >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
          {BRLFormatter.format(ganhoCapital)}
        </strong>{' '}
        ⇒ débito de {BRLFormatter.format(tradeFinancials.costBasisBrl.amount)} (
        {USDFormatter.formatWithPrecision(precoCustoUnitario)} × PTAX{' '}
        {BRLFormatter.formatWithPrecision(ptaxBid)}) e crédito de{' '}
        {BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} (
        {USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} × PTAX{' '}
        {BRLFormatter.formatWithPrecision(ptaxAsk)}).
        <br /><br />
        <strong>Detalhes da venda:</strong>
        <br />
        • Quantidade vendida: <strong>{operationQty} ações</strong>
        <br />
        • Preço de venda: {USDFormatter.formatWithPrecision(precoVendaUnitario)} por ação
        <br />
        • Preço médio de custo: {USDFormatter.formatWithPrecision(precoCustoUnitario)} por ação
        <br />
        • Lucro por ação (USD): {USDFormatter.format(lucroUnitarioUsd)}
        <br />
        • Lucro por ação (BRL): {BRLFormatter.format(lucroUnitarioUsd * ptaxAsk)}
        <br /><br />
        <strong>Resultado:</strong>
        <br />
        • Ações restantes: <strong>{position.quantity.value}</strong>
        <br />
        • Lucro bruto acumulado: {BRLFormatter.format(position.grossProfitBrl.amount)}
      </div>
    </div>
  );
}
