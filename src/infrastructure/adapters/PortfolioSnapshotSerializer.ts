import { PortfolioSnapshot } from '../../domain/entities';

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export const PortfolioSnapshotSerializer = {
  csvHeaders(): string[] {
    return [
      'Data da Operação',
      'Operação',
      'Quantidade da Operação',
      'Quantidade Total',
      'Custo Acumulado USD',
      'Preço Médio USD',
      'Custo Acumulado BRL',
      'Preço Médio BRL',
      'Ganho/Perda Total BRL',
    ];
  },

  toCSVRow(snapshot: PortfolioSnapshot): string[] {
    const { metadata, position } = snapshot;
    return [
      formatDate(metadata.operationDate),
      snapshot.getOperationDescription(),
      metadata.quantity.value.toString(),
      position.quantity.value.toString(),
      position.totalCostUsd.amount.toFixed(4),
      position.averagePriceUsd.amount.toFixed(4),
      position.totalCostBrl.amount.toFixed(4),
      position.averagePriceBrl.amount.toFixed(4),
      position.grossProfitBrl.amount.toFixed(4),
    ];
  },

  toJSON(snapshot: PortfolioSnapshot): Record<string, unknown> {
    const { metadata, position } = snapshot;
    return {
      operation: {
        type: metadata.operationType,
        date: metadata.operationDate.toISOString(),
        quantity: metadata.quantity.value,
        pricePerShare: metadata.pricePerShareUsd.amount,
      },
      position: {
        quantity: position.quantity.value,
        totalCostUsd: position.totalCostUsd.amount,
        totalCostBrl: position.totalCostBrl.amount,
        averagePriceUsd: position.averagePriceUsd.amount,
        grossProfitBrl: position.grossProfitBrl.amount,
        lastUpdated: position.lastUpdated.toISOString(),
      },
      exchangeRates: {
        ptaxBid: metadata.exchangeRates.ptaxBid,
        ptaxAsk: metadata.exchangeRates.ptaxAsk,
      },
      tradeDetails: metadata.tradeFinancials
        ? {
            saleRevenueUsd: metadata.tradeFinancials.saleRevenueUsd.amount,
            saleRevenueBrl: metadata.tradeFinancials.saleRevenueBrl.amount,
            costBasisUsd: metadata.tradeFinancials.costBasisUsd.amount,
            costBasisBrl: metadata.tradeFinancials.costBasisBrl.amount,
            profitLossBrl: metadata.tradeFinancials.profitLossBrl.amount,
          }
        : null,
    };
  },
};
