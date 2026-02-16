import { PortfolioOperation } from '../../domain/operations';
import { IOperationRepository } from '../../application/interfaces';

export class CompositeOperationRepository implements IOperationRepository {
  constructor(private readonly repositories: IOperationRepository[]) {}

  async getAllOperations(): Promise<PortfolioOperation[]> {
    const allOperations: PortfolioOperation[] = [];

    for (const repo of this.repositories) {
      try {
        const operations = await repo.getAllOperations();
        allOperations.push(...operations);
      } catch (_error) {
      }
    }

    allOperations.sort((a, b) => a.getDate().getTime() - b.getDate().getTime());

    return allOperations;
  }
}

