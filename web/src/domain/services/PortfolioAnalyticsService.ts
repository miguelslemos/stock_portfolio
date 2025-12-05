import { PortfolioPosition, Money, ProfitLoss, ExchangeRate } from '../entities';

export class PortfolioAnalyticsService {
  calculateTotalReturnBrl(positions: PortfolioPosition[]): ProfitLoss {
    if (positions.length === 0) {
      return new ProfitLoss(0, 'BRL');
    }

    return positions[positions.length - 1]!.grossProfitBrl;
  }

  calculatePositionValueBrl(
    position: PortfolioPosition,
    currentPriceUsd: Money,
    exchangeRate: ExchangeRate
  ): Money {
    if (position.isEmpty) {
      return new Money(0, 'BRL');
    }

    const marketValueUsd = new Money(
      currentPriceUsd.amount * position.quantity.value,
      'USD'
    );
    return exchangeRate.convert(marketValueUsd);
  }

  calculateUnrealizedGainLossBrl(
    position: PortfolioPosition,
    currentPriceUsd: Money,
    exchangeRate: ExchangeRate
  ): Money {
    if (position.isEmpty) {
      return new Money(0, 'BRL');
    }

    const currentValue = this.calculatePositionValueBrl(position, currentPriceUsd, exchangeRate);
    return new Money(currentValue.amount - position.totalCostBrl.amount, 'BRL');
  }
}

