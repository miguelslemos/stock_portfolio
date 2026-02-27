import { PortfolioSnapshot } from '../domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from './formatters';
import { PortfolioPosition } from '../domain/entities';

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
            
            ${this.renderYearSummary(year, yearSnapshots, finalPosition, initialPosition, totalVested, totalSold, totalProfitLoss, avgPtaxBid, avgPtaxAsk, trades)}
            ${this.renderOperationsTable(yearSnapshots)}
            ${this.renderTaxSummary(year, yearSnapshots, totalProfitLoss)}

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
    finalPosition: PortfolioPosition,
    initialPosition: PortfolioPosition | null,
    totalVested: number,
    totalSold: number,
    totalProfitLoss: number,
    avgPtaxBid: number,
    avgPtaxAsk: number,
    trades: PortfolioSnapshot[]
  ): string {
    const initialQty = initialPosition?.quantity.value ?? 0;
    const finalQty = finalPosition.quantity.value;
    const netChange = finalQty - initialQty;

    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;
    const isFutureYear = year > currentYear;
    const yearInProgress = isCurrentYear || isFutureYear;

    const yearEndQtyLabel = yearInProgress 
      ? `Quantidade Atual ${isCurrentYear ? '*' : '**'}`
      : 'Quantidade no Fim do Ano';
    
    const yearEndQtyDetail = yearInProgress
      ? isCurrentYear 
        ? '* Ano em andamento'
        : '** Ano futuro'
      : `Em 31/12/${year}`;

    return `
      <div class="detail-section">
        <h3>Resumo do Ano ${year}</h3>
        ${yearInProgress ? `
          <div class="year-in-progress-notice">
            <span class="notice-icon">${isCurrentYear ? '⏳' : '🔮'}</span>
            <span class="notice-text">
              ${isCurrentYear 
                ? '<strong>Ano em andamento:</strong> Os valores mostrados refletem as operações até o momento. Novas operações podem alterar os resultados.'
                : '<strong>Ano futuro:</strong> As operações mostradas são de um ano que ainda não começou ou está em andamento.'
              }
            </span>
          </div>
        ` : ''}
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
          
          <div class="summary-card ${yearInProgress ? 'highlight-card' : ''}">
            <div class="summary-label">${yearEndQtyLabel}</div>
            <div class="summary-value large">${finalQty}</div>
            <div class="summary-detail">${yearEndQtyDetail}</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Total de Vendas</div>
            <div class="summary-value">${trades.length}</div>
            <div class="summary-detail">Operações de venda</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Total Vendido (BRL)</div>
            <div class="summary-value">
              ${BRLFormatter.format(trades.reduce((sum, t) => 
                sum + (t.metadata.tradeFinancials?.saleRevenueBrl.amount ?? 0), 0
              ))}
            </div>
            <div class="summary-detail">Valor bruto de vendas</div>
          </div>

          <div class="summary-card">
            <div class="summary-label">Custo Total das Vendas (BRL)</div>
            <div class="summary-value">
              ${BRLFormatter.format(trades.reduce((sum, t) => 
                sum + (t.metadata.tradeFinancials?.costBasisBrl.amount ?? 0), 0
              ))}
            </div>
            <div class="summary-detail">Base de custo</div>
          </div>
          
          <div class="summary-card">
            <div class="summary-label">Lucro/Prejuízo Total</div>
            <div class="summary-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(totalProfitLoss)}
            </div>
            <div class="summary-detail">Resultado das vendas</div>
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
            <div class="summary-value">${BRLFormatter.formatWithPrecision(finalPosition.averagePriceBrl().amount)}</div>
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
          <td>${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)}</td>
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

  private static renderTaxSummary(year: number, yearSnapshots: PortfolioSnapshot[], totalProfitLoss: number): string {
    const lastSnapshot = yearSnapshots.length > 0 ? yearSnapshots[yearSnapshots.length - 1] : null;
    const finalPosition = lastSnapshot?.position;
    const totalCostBrl = finalPosition?.totalCostBrl.amount ?? 0;
    const totalCostUsd = finalPosition?.totalCostUsd.amount ?? 0;
    const finalQty = finalPosition?.quantity.value ?? 0;
    const avgPriceBrl = finalPosition ? finalPosition.averagePriceBrl().amount : 0;
    const avgPriceUsd = finalPosition ? finalPosition.averagePriceUsd.amount : 0;
    const currentYear = new Date().getFullYear();
    const isCurrentYear = year === currentYear;
    const isFutureYear = year > currentYear;
    const yearInProgress = isCurrentYear || isFutureYear;

    const situationLabel = yearInProgress
      ? `Situação Atual ${isCurrentYear ? '*' : '**'}`
      : `Situação 31/12/${year}`;

    const situationDetail = yearInProgress
      ? isCurrentYear
        ? '* Ano em andamento'
        : '** Ano futuro'
      : 'Valor para declarar';

    return `
      <div class="detail-section">
        <h3>💰 Resumo para Imposto de Renda ${year}</h3>
        
        <div class="tax-summary-cards">
          <div class="tax-card highlight-card">
            <div class="tax-label">${situationLabel}</div>
            <div class="tax-value">
              ${BRLFormatter.format(totalCostBrl)}
            </div>
            <div class="tax-detail">${situationDetail}</div>
          </div>

          <div class="tax-card">
            <div class="tax-label">Lucro/Prejuízo Total (BRL)</div>
            <div class="tax-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(totalProfitLoss)}
            </div>
            <div class="tax-detail">Resultado das vendas</div>
          </div>

          <div class="tax-card">
            <div class="tax-label">Quantidade de Ações Fim do Ano</div>
            <div class="tax-value large">${finalQty}</div>
            <div class="tax-detail">Ações em carteira</div>
          </div>

          <div class="tax-card">
            <div class="tax-label">Preço Médio (BRL)</div>
            <div class="tax-value">
              ${BRLFormatter.formatWithPrecision(avgPriceBrl)}
            </div>
            <div class="tax-detail">Por ação</div>
          </div>
        </div>

        <div class="tax-info">
          <h4>ℹ️ Como Declarar no IRPF:</h4>
          <ul>
            <li><strong>Bens e Direitos:</strong> Grupo 03 - Participações em sociedades, Código 01 - Ações (inclusive as listadas em bolsa)</li>
            <li><strong>Localização(País):</strong> 137 - Cayman, Ilhas</li>
            <li><strong>Discriminação:</strong> NU - ${finalQty} Acoes da empresa Nu Holdings Ltd. negociadas na Bolsa do pais Estados Unidos através do codigo: NU, adquiridas pela corretora ETrade. Valor de custo em ${USDFormatter.format(totalCostUsd)} ou ${BRLFormatter.format(totalCostBrl)} com preço médio de ${USDFormatter.formatWithPrecision(avgPriceUsd)} ou ${BRLFormatter.formatWithPrecision(avgPriceBrl)} por ação. Corretora: ETrade</li>
            <li><strong>Negociado em bolsa:</strong> Sim</li>
            <li><strong>Código da Negociação:</strong> NU</li>
            <li><strong>Situação em 31/12/${year}:</strong> ${BRLFormatter.format(totalCostBrl)}</li>
            <li><strong>Aplicação Financeira/Lucro ou Prejuízo:</strong> ${BRLFormatter.format(totalProfitLoss)}</li>
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

