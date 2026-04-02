import type { PortfolioSnapshot } from '../../domain/entities';
import { BRLFormatter, USDFormatter } from '../../infrastructure/utils/formatters';

/**
 * Summary of portfolio activity and IRPF data for a single year.
 * Used by the Detalhes do Ano modal and the yearly_summary CSV export.
 */
export interface YearSummary {
  readonly year: number;
  readonly totalOperations: number;
  readonly totalVested: number;
  readonly totalSold: number;
  readonly netChange: number;
  readonly initialQty: number;
  readonly finalQty: number;
  readonly totalCostBrl: number;
  readonly totalCostUsd: number;
  readonly totalProfitLoss: number;
  readonly totalSaleRevenue: number;
  readonly totalCostBasis: number;
  readonly avgPtaxAsk: number;
  readonly finalAvgPriceUsd: number;
  readonly finalAvgPriceBrl: number;
  readonly yearInProgress: boolean;
  readonly isCurrentYear: boolean;
  readonly vestingCount: number;
  readonly tradeCount: number;
  /** IRPF copyable fields (same text as in the modal) */
  readonly irpfBensEDireitos: string;
  readonly irpfLocalizacao: string;
  readonly irpfDiscriminacao: string;
  readonly irpfNegociadoEmBolsa: string;
  readonly irpfCodigoNegociacao: string;
  readonly irpfSituacao3112: string;
  readonly irpfRendimentoOuPerda: string;
  readonly irpfImpostoPagoNoExterior: string;
}

/**
 * Compute year-level summary and IRPF strings from snapshots for a given year.
 * Returns null if yearSnapshots is empty or first/last snapshot is missing.
 */
export function computeYearSummary(
  year: number,
  yearSnapshots: PortfolioSnapshot[]
): YearSummary | null {
  if (yearSnapshots.length === 0) return null;

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
  const totalSaleRevenue = trades.reduce(
    (sum, t) => sum + (t.metadata.tradeFinancials?.saleRevenueBrl.amount ?? 0),
    0
  );
  const totalCostBasis = trades.reduce(
    (sum, t) => sum + (t.metadata.tradeFinancials?.costBasisBrl.amount ?? 0),
    0
  );

  const avgPtaxAsk =
    yearSnapshots.reduce((sum, s) => sum + s.metadata.exchangeRates.ptaxAsk, 0) /
    yearSnapshots.length;

  const initialQty = initialPosition?.quantity.value ?? 0;
  const finalQty = finalPosition.quantity.value;
  const netChange = finalQty - initialQty;

  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;
  const isFutureYear = year > currentYear;
  const yearInProgress = isCurrentYear || isFutureYear;

  const totalCostBrl = finalPosition.totalCostBrl.amount;
  const totalCostUsd = finalPosition.totalCostUsd.amount;
  const finalAvgPriceUsd = finalPosition.averagePriceUsd.amount;
  const finalAvgPriceBrl = finalPosition.averagePriceBrl.amount;

  const irpfBensEDireitos =
    'Grupo 03 - Participações em sociedades, Código 01 - Ações (inclusive as listadas em bolsa)';
  const irpfLocalizacao = '137 - Cayman, Ilhas';
  const irpfDiscriminacao = `NU - ${finalQty} Ações da empresa Nu Holdings Ltd. negociadas na Bolsa dos Estados Unidos através do código: NU, adquiridas pela corretora ETrade. Valor de custo em ${USDFormatter.format(totalCostUsd)} ou ${BRLFormatter.format(totalCostBrl)} com preço médio de ${USDFormatter.format(finalAvgPriceUsd)} ou ${BRLFormatter.format(finalAvgPriceBrl)} por ação.`;
  const irpfNegociadoEmBolsa = 'Sim';
  const irpfCodigoNegociacao = 'NU';
  const irpfSituacao3112 = BRLFormatter.format(totalCostBrl).replace('R$', '');
  const irpfRendimentoOuPerda = BRLFormatter.format(totalProfitLoss).replace('R$', '');
  const irpfImpostoPagoNoExterior = BRLFormatter.format(0).replace('R$', '');

  return {
    year,
    totalOperations: yearSnapshots.length,
    totalVested,
    totalSold,
    netChange,
    initialQty,
    finalQty,
    totalCostBrl,
    totalCostUsd,
    totalProfitLoss,
    totalSaleRevenue,
    totalCostBasis,
    avgPtaxAsk,
    finalAvgPriceUsd,
    finalAvgPriceBrl,
    yearInProgress,
    isCurrentYear,
    vestingCount: vestings.length,
    tradeCount: trades.length,
    irpfBensEDireitos,
    irpfLocalizacao,
    irpfDiscriminacao,
    irpfNegociadoEmBolsa,
    irpfCodigoNegociacao,
    irpfSituacao3112,
    irpfRendimentoOuPerda,
    irpfImpostoPagoNoExterior,
  };
}
