import { PortfolioSnapshot } from '../domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from './formatters';

/**
 * Builder for year detail modals
 * Shows all operations and summary for a specific year
 */
export class YearDetailsBuilder {
  /**
   * Create a modal showing year details
   */
  static createYearModal(year: number, yearSnapshots: PortfolioSnapshot[]): HTMLElement {
    const firstSnapshot = yearSnapshots[0];
    const lastSnapshot = yearSnapshots[yearSnapshots.length - 1];
    
    if (!firstSnapshot || !lastSnapshot) {
      throw new Error('No snapshots for year');
    }

    const finalPosition = lastSnapshot.position;
    const initialPosition = firstSnapshot.previousPosition;
    
    // Calculate year statistics
    const vestings = yearSnapshots.filter(s => s.metadata.isVesting);
    const trades = yearSnapshots.filter(s => s.metadata.isTrade);
    
    const totalVested = vestings.reduce((sum, s) => sum + s.metadata.quantity.value, 0);
    const totalSold = trades.reduce((sum, s) => sum + s.metadata.quantity.value, 0);
    
    const totalProfitLoss = trades.reduce((sum, s) => {
      const profit = s.metadata.tradeFinancials?.profitLossBrl.amount ?? 0;
      return sum + profit;
    }, 0);

    const avgPtaxBid = yearSnapshots.reduce((sum, s) => sum + s.metadata.exchangeRates.ptaxBid, 0) / yearSnapshots.length;
    const avgPtaxAsk = yearSnapshots.reduce((sum, s) => sum + s.metadata.exchangeRates.ptaxAsk, 0) / yearSnapshots.length;

    const modalHtml = `
      <div class="modal-overlay">
        <div class="modal modal-large">
          <div class="modal-header">
            <h2>📅 Detalhes do Ano ${year}</h2>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            
            ${this.renderYearSummary(year, yearSnapshots, finalPosition, initialPosition, totalVested, totalSold, totalProfitLoss, avgPtaxBid, avgPtaxAsk)}
            ${this.renderOperationsTable(yearSnapshots)}
            ${this.renderTaxSummary(year, trades, totalProfitLoss)}

          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    return div.firstElementChild as HTMLElement;
  }

  private static renderYearSummary(
    year: number,
    snapshots: PortfolioSnapshot[],
    finalPosition: import('../domain/entities').PortfolioPosition,
    initialPosition: import('../domain/entities').PortfolioPosition | null,
    totalVested: number,
    totalSold: number,
    totalProfitLoss: number,
    avgPtaxBid: number,
    avgPtaxAsk: number
  ): string {
    const initialQty = initialPosition?.quantity.value ?? 0;
    const finalQty = finalPosition.quantity.value;
    const netChange = finalQty - initialQty;
    const ptaxBid = snapshots[snapshots.length - 1]!.metadata.exchangeRates.ptaxBid;

    return `
      <div class="detail-section">
        <h3>Resumo do Ano ${year}</h3>
        <div class="year-summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total de Operações</div>
            <div class="summary-value">${snapshots.length}</div>
            <div class="summary-detail">${snapshots.filter(s => s.metadata.isVesting).length} vestings • ${snapshots.filter(s => s.metadata.isTrade).length} vendas</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Ações Recebidas (Vesting)</div>
            <div class="summary-value positive">+${totalVested}</div>
            <div class="summary-detail">${snapshots.filter(s => s.metadata.isVesting).length} operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Ações Vendidas</div>
            <div class="summary-value ${totalSold > 0 ? 'negative' : ''}">-${totalSold}</div>
            <div class="summary-detail">${snapshots.filter(s => s.metadata.isTrade).length} operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Variação Líquida</div>
            <div class="summary-value ${netChange >= 0 ? 'positive' : 'negative'}">${netChange >= 0 ? '+' : ''}${netChange}</div>
            <div class="summary-detail">${initialQty} → ${finalQty} ações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Lucro/Prejuízo Total</div>
            <div class="summary-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(totalProfitLoss)}
            </div>
            <div class="summary-detail">Apenas vendas</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Lucro Bruto Acumulado</div>
            <div class="summary-value ${finalPosition.grossProfitBrl.amount >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(finalPosition.grossProfitBrl.amount)}
            </div>
            <div class="summary-detail">Posição final do ano</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">PTAX Média Compra</div>
            <div class="summary-value">${avgPtaxBid.toFixed(4)}</div>
            <div class="summary-detail">Média das operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">PTAX Média Venda</div>
            <div class="summary-value">${avgPtaxAsk.toFixed(4)}</div>
            <div class="summary-detail">Média das operações</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Preço Médio Final (USD)</div>
            <div class="summary-value">${USDFormatter.formatWithPrecision(finalPosition.averagePriceUsd.amount)}</div>
            <div class="summary-detail">Por ação</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Preço Médio Final (BRL)</div>
            <div class="summary-value">${BRLFormatter.formatWithPrecision(finalPosition.averagePriceBrl(ptaxBid).amount)}</div>
            <div class="summary-detail">Por ação</div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderOperationsTable(snapshots: PortfolioSnapshot[]): string {
    const rows = snapshots
      .map((snapshot) => {
        const metadata = snapshot.metadata;
        const position = snapshot.position;
        const ptaxBid = metadata.exchangeRates.ptaxBid;
        const operationDesc = snapshot.getOperationDescription();
        const profitLoss = snapshot.getOperationProfitLoss();

        return `
        <tr>
          <td>${DateFormatter.format(metadata.operationDate)}</td>
          <td>${operationDesc}</td>
          <td>${metadata.quantity.value}</td>
          <td>${USDFormatter.formatWithPrecision(metadata.pricePerShareUsd.amount)}</td>
          <td>${position.quantity.value}</td>
          <td>${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}</td>
          <td>${BRLFormatter.formatWithPrecision(position.averagePriceBrl(ptaxBid).amount)}</td>
          <td class="${profitLoss && profitLoss.amount >= 0 ? 'positive' : profitLoss ? 'negative' : ''}">
            ${profitLoss ? BRLFormatter.format(profitLoss.amount) : '-'}
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <div class="detail-section">
        <h3>Operações do Ano</h3>
        <div class="operations-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Operação</th>
                <th>Qtd. Op.</th>
                <th>Preço (USD)</th>
                <th>Qtd. Final</th>
                <th>Preço Médio (USD)</th>
                <th>Preço Médio (BRL)</th>
                <th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  private static renderTaxSummary(year: number, trades: PortfolioSnapshot[], totalProfitLoss: number): string {
    if (trades.length === 0) {
      return `
        <div class="detail-section">
          <h3>💰 Resumo para Imposto de Renda</h3>
          <div class="tax-info">
            <p>✅ Nenhuma venda realizada em ${year}</p>
            <p>Não há lucro ou prejuízo a declarar para este ano.</p>
          </div>
        </div>
      `;
    }

    // Group trades by month
    const tradesByMonth = new Map<number, PortfolioSnapshot[]>();
    trades.forEach(trade => {
      const month = trade.metadata.operationDate.getMonth();
      if (!tradesByMonth.has(month)) {
        tradesByMonth.set(month, []);
      }
      tradesByMonth.get(month)!.push(trade);
    });

    const monthlyDetails = Array.from(tradesByMonth.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, monthTrades]) => {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const totalSaleRevenue = monthTrades.reduce((sum, t) => 
          sum + (t.metadata.tradeFinancials?.saleRevenueBrl.amount ?? 0), 0
        );
        const monthProfit = monthTrades.reduce((sum, t) => 
          sum + (t.metadata.tradeFinancials?.profitLossBrl.amount ?? 0), 0
        );
        
        return `
          <tr>
            <td>${monthNames[month]}</td>
            <td>${monthTrades.length}</td>
            <td>${BRLFormatter.format(totalSaleRevenue)}</td>
            <td class="${monthProfit >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(monthProfit)}
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="detail-section">
        <h3>💰 Resumo para Imposto de Renda ${year}</h3>
        
        <div class="tax-summary-cards">
          <div class="tax-card">
            <div class="tax-label">Lucro/Prejuízo Total do Ano</div>
            <div class="tax-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(totalProfitLoss)}
            </div>
            <div class="tax-detail">Todas as vendas</div>
          </div>
          
          <div class="tax-card">
            <div class="tax-label">Total de Vendas</div>
            <div class="tax-value">${trades.length}</div>
            <div class="tax-detail">Operações de venda</div>
          </div>
          
          <div class="tax-card">
            <div class="tax-label">Total Vendido (BRL)</div>
            <div class="tax-value">
              ${BRLFormatter.format(trades.reduce((sum, t) => 
                sum + (t.metadata.tradeFinancials?.saleRevenueBrl.amount ?? 0), 0
              ))}
            </div>
            <div class="tax-detail">Valor bruto de vendas</div>
          </div>
        </div>

        <h4>Detalhamento Mensal</h4>
        <div class="operations-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th>Vendas</th>
                <th>Total Vendido (BRL)</th>
                <th>Lucro/Prejuízo</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyDetails}
            </tbody>
          </table>
        </div>

        <div class="tax-info">
          <h4>ℹ️ Informações Importantes:</h4>
          <ul>
            <li><strong>Declaração:</strong> Todas as operações com ações devem ser declaradas no IRPF</li>
            <li><strong>Prejuízo:</strong> Pode ser compensado com lucros futuros em operações day-trade ou swing trade</li>
            <li><strong>Documentação:</strong> Guarde todos os comprovantes de compra e venda</li>
            <li><strong>Regime de tributação:</strong> Consulte a legislação vigente ou um contador</li>
          </ul>
          <p class="disclaimer">
            ⚠️ <strong>Atenção:</strong> Este é apenas um resumo das operações. 
            Consulte um contador para orientação fiscal precisa e atualizada sobre suas obrigações tributárias.
          </p>
        </div>
      </div>
    `;
  }
}

