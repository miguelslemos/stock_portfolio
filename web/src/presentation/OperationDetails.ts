import { PortfolioPosition } from '../domain/entities';

export interface OperationDetails {
  position: PortfolioPosition;
  previousPosition: PortfolioPosition | null;
  saleRevenueUsd?: number;
  saleRevenueBrl?: number;
  costBasisBrl?: number;
  profitLoss?: number;
  ptaxBid?: number;
  ptaxAsk?: number;
}

