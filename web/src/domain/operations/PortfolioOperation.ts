import { PortfolioPosition, OperationResult, ExchangeRate } from '../entities';

export interface PortfolioOperation {
  execute(currentPosition: PortfolioPosition, exchangeRate: ExchangeRate): OperationResult;
  getDate(): Date;
  getSettlementDate(): Date;
  getDescription(): string;
}

