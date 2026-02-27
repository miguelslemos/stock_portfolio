import { PortfolioSnapshot, OperationMetadata, PortfolioPosition } from '../domain/entities';
import { BRLFormatter, USDFormatter, DateFormatter } from './formatters';

/**
 * Builder for operation detail modals
 * Separates modal creation logic from PortfolioApp
 */
export class ModalBuilder {
  /**
   * Create a modal showing operation details
   */
  static createOperationModal(snapshot: PortfolioSnapshot): HTMLElement {
    const position = snapshot.position;
    const metadata = snapshot.metadata;
    const previousPosition = snapshot.previousPosition;
    
    const isVesting = metadata.isVesting;
    const isTrade = metadata.isTrade;
    const operationQty = metadata.quantity.value;
    const previousQty = previousPosition?.quantity.value ?? 0;
    
    const ptaxBid = metadata.exchangeRates.ptaxBid;
    const ptaxAsk = metadata.exchangeRates.ptaxAsk;

    // Generate description
    const description = this.generateDescription(snapshot, previousQty, ptaxBid, ptaxAsk);

    const modalHtml = `
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>📋 Detalhes da Operação</h2>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            
            ${this.renderGeneralInfo(metadata, operationQty, isVesting)}
            ${this.renderPortfolioPosition(position, previousQty)}
            ${this.renderAveragePrices(position, ptaxBid)}
            ${isTrade ? this.renderTradeDetails(snapshot, ptaxAsk) : ''}
            ${isTrade ? this.renderProfitLoss(snapshot, previousPosition) : ''}
            
            <div class="detail-section">
              <h3>Descrição da Operação</h3>
              <div class="description-box">
                ${description}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    return div.firstElementChild as HTMLElement;
  }

  private static generateDescription(
    snapshot: PortfolioSnapshot,
    previousQty: number,
    ptaxBid: number,
    ptaxAsk: number
  ): string {
    const position = snapshot.position;
    const metadata = snapshot.metadata;
    const previousPosition = snapshot.previousPosition;
    const isVesting = metadata.isVesting;
    const operationQty = metadata.quantity.value;
    const settlementDate = DateFormatter.format(metadata.settlementDate);

    if (isVesting) {
      const custoUnitarioUsd = metadata.pricePerShareUsd.amount;
      const custoTotalUsd = metadata.totalCostUsd.amount;
      const custoTotalBrl = metadata.totalCostBrl.amount;

      return `
        <strong>Operação de Vesting em NU</strong><br><br>
        Em <strong>${settlementDate}</strong>, foram adicionadas <strong>${operationQty} ações</strong> 
        ao portfólio através de vesting.<br><br>
        
        <strong>Custo da operação:</strong><br>
        • Valor unitário: ${USDFormatter.formatWithPrecision(custoUnitarioUsd)}<br>
        • Custo total: ${USDFormatter.format(custoTotalUsd)} 
        = ${BRLFormatter.format(custoTotalBrl)} 
        (PTAX Compra ${BRLFormatter.formatWithPrecision(ptaxBid)})<br><br>
        
        <strong>Impacto no portfólio:</strong><br>
        • Ações antes: ${previousQty}<br>
        • Ações adicionadas: +${operationQty}<br>
        • Ações após: <strong>${position.quantity.value}</strong><br>
        • Novo preço médio: ${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}
        (${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)})<br>
        • Custo total acumulado: ${BRLFormatter.format(position.totalCostBrl.amount)}
      `;
    } else {
      const tradeFinancials = metadata.tradeFinancials;
      if (!tradeFinancials || !previousPosition) return '';

      const ganhoCapital = position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount;
      const precoCustoUnitario = previousPosition.averagePriceUsd.amount;
      const precoVendaUnitario = metadata.pricePerShareUsd.amount;
      const lucroUnitarioUsd = precoVendaUnitario - precoCustoUnitario;

      return `
        <strong>Operação Encerrada em NU</strong><br><br>
        Em <strong>${settlementDate}</strong>, o ganho de capital foi de 
        <strong class="${ganhoCapital >= 0 ? 'positive' : 'negative'}">${BRLFormatter.format(ganhoCapital)}</strong> 
        ⇒ débito de ${BRLFormatter.format(tradeFinancials.costBasisBrl.amount)} 
        (${USDFormatter.formatWithPrecision(precoCustoUnitario)} × 
        PTAX ${BRLFormatter.formatWithPrecision(ptaxBid)}) 
        e crédito de ${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} 
        (${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} × 
        PTAX ${BRLFormatter.formatWithPrecision(ptaxAsk)}).<br><br>
        
        <strong>Detalhes da venda:</strong><br>
        • Quantidade vendida: <strong>${operationQty} ações</strong><br>
        • Preço de venda: ${USDFormatter.formatWithPrecision(precoVendaUnitario)} por ação<br>
        • Preço médio de custo: ${USDFormatter.formatWithPrecision(precoCustoUnitario)} por ação<br>
        • Lucro por ação (USD): ${USDFormatter.format(lucroUnitarioUsd)}<br>
        • Lucro por ação (BRL): ${BRLFormatter.format(lucroUnitarioUsd * ptaxAsk)}<br><br>
        
        <strong>Resultado:</strong><br>
        • Ações restantes: <strong>${position.quantity.value}</strong><br>
        • Lucro bruto acumulado: ${BRLFormatter.format(position.grossProfitBrl.amount)}
      `;
    }
  }

  private static renderGeneralInfo(
    metadata: OperationMetadata,
    operationQty: number,
    isVesting: boolean
  ): string {
    return `
      <div class="detail-section">
        <h3>Informações Gerais</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Tipo de Operação</label>
            <div class="value">
              <span class="operation-badge ${isVesting ? 'vesting' : 'trade'}">
                ${isVesting ? '📈 Vesting' : '📉 Trade (Venda)'}
              </span>
            </div>
          </div>
          <div class="detail-item">
            <label>Data da Operação</label>
            <div class="value">${DateFormatter.formatLong(metadata.operationDate)}</div>
          </div>
          <div class="detail-item">
            <label>Data da Liquidação</label>
            <div class="value">${DateFormatter.formatLong(metadata.settlementDate)}</div>
          </div>
          <div class="detail-item">
            <label>Quantidade da Operação</label>
            <div class="value large">${isVesting ? '+' : '-'}${operationQty}</div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderPortfolioPosition(position: PortfolioPosition, previousQty: number): string {
    return `
      <div class="detail-section">
        <h3>Posição do Portfólio</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Ações Antes</label>
            <div class="value">${previousQty}</div>
          </div>
          <div class="detail-item">
            <label>Ações Após</label>
            <div class="value large">${position.quantity.value}</div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderAveragePrices(position: PortfolioPosition, ptaxBid: number): string {
    return `
      <div class="detail-section">
        <h3>Preços Médios</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Preço Médio (USD)</label>
            <div class="value">${USDFormatter.formatWithPrecision(position.averagePriceUsd.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Preço Médio (BRL)</label>
            <div class="value">${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)}</div>
          </div>
          <div class="detail-item">
            <label>PTAX Compra</label>
            <div class="value">${BRLFormatter.formatWithPrecision(ptaxBid)}</div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Preço Médio BRL = Custo Total BRL ÷ Quantidade</div>
          ${BRLFormatter.formatWithPrecision(position.averagePriceBrl().amount)} = ${BRLFormatter.formatWithPrecision(position.totalCostBrl.amount)} ÷ ${position.quantity.value}
        </div>
      </div>
    `;
  }

  private static renderTradeDetails(snapshot: PortfolioSnapshot, ptaxAsk: number): string {
    const tradeFinancials = snapshot.metadata.tradeFinancials;
    if (!tradeFinancials) return '';

    const liquidationPrice = snapshot.metadata.pricePerShareUsd.amount;
    const operationQty = snapshot.metadata.quantity.value;

    return `
      <div class="detail-section">
        <h3>Valores da Venda</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Preço de Liquidação (USD)</label>
            <div class="value">${USDFormatter.formatWithPrecision(liquidationPrice)}</div>
          </div>
          <div class="detail-item">
            <label>Total Liquidado (USD)</label>
            <div class="value">${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Total Liquidado (BRL)</label>
            <div class="value">${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)}</div>
          </div>
          <div class="detail-item">
            <label>PTAX Venda</label>
            <div class="value">${BRLFormatter.formatWithPrecision(ptaxAsk)}</div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Total Liquidado USD = Preço de Liquidação × Quantidade</div>
          ${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} = ${USDFormatter.formatWithPrecision(liquidationPrice)} × ${operationQty}
        </div>
        <div class="calculation-detail">
          <div class="formula">Liquidado BRL = Liquidado USD × PTAX Venda</div>
          ${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} = ${USDFormatter.format(tradeFinancials.saleRevenueUsd.amount)} × ${ptaxAsk.toFixed(6)}
        </div>
      </div>
    `;
  }

  private static renderProfitLoss(snapshot: PortfolioSnapshot, previousPosition: PortfolioPosition | null): string {
    const tradeFinancials = snapshot.metadata.tradeFinancials;
    if (!tradeFinancials || !previousPosition) return '';

    const ganhoCapital = snapshot.position.grossProfitBrl.amount - previousPosition.grossProfitBrl.amount;

    return `
      <div class="detail-section">
        <h3>Lucro/Prejuízo</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Custo Base (BRL)</label>
            <div class="value">${BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}</div>
          </div>
          <div class="detail-item">
            <label>Ganho de Capital</label>
            <div class="value ${ganhoCapital >= 0 ? 'positive' : 'negative'}">
              ${BRLFormatter.format(ganhoCapital)}
            </div>
          </div>
        </div>
        <div class="calculation-detail">
          <div class="formula">Ganho de Capital = Liquidado BRL - Custo Base BRL</div>
          ${BRLFormatter.format(ganhoCapital)} = ${BRLFormatter.format(tradeFinancials.saleRevenueBrl.amount)} - ${BRLFormatter.format(tradeFinancials.costBasisBrl.amount)}
        </div>
      </div>
    `;
  }
}
