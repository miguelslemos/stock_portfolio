import { PortfolioOperation } from '../../domain/operations';

export interface IOperationRepository {
  getAllOperations(): Promise<PortfolioOperation[]>;
}

