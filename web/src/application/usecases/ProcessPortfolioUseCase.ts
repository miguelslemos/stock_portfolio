import { PortfolioPosition, ProfitLoss, PortfolioSnapshot } from '../../domain/entities';
import { PortfolioCalculationService, PortfolioAnalyticsService } from '../../domain/services';
import { IOperationRepository, IDataExportService } from '../interfaces';

export interface ProcessPortfolioRequest {
  initialPosition?: PortfolioPosition;
  exportData?: boolean;
}

export interface ProcessPortfolioResponse {
  finalPosition: PortfolioPosition;
  snapshots: PortfolioSnapshot[];
  totalOperations: number;
  totalReturnBrl: ProfitLoss;
}

/**
 * Use case for processing portfolio operations
 * 
 * Orchestrates the complete workflow:
 * 1. Load operations from repositories
 * 2. Execute operations chronologically
 * 3. Create snapshots for each operation
 * 4. Calculate analytics
 * 5. Export data (optional)
 */
export class ProcessPortfolioUseCase {
  constructor(
    private readonly operationRepository: IOperationRepository,
    private readonly calculationService: PortfolioCalculationService,
    private readonly analyticsService: PortfolioAnalyticsService,
    private readonly exportService?: IDataExportService
  ) {}

  async execute(request: ProcessPortfolioRequest): Promise<ProcessPortfolioResponse> {
    // Load all operations
    const operations = await this.operationRepository.getAllOperations();

    if (operations.length === 0) {
      const emptyPosition = PortfolioPosition.createEmpty(new Date());
      return {
        finalPosition: emptyPosition,
        snapshots: [],
        totalOperations: 0,
        totalReturnBrl: new ProfitLoss(0, 'BRL'),
      };
    }

    // Execute operations
    const { positions, results } = await this.calculationService.executeOperations(
      operations,
      request.initialPosition
    );

    const finalPosition = positions[positions.length - 1];
    if (!finalPosition) {
      throw new Error('Failed to calculate final position');
    }

    // Create snapshots (combines position + metadata for each operation)
    const snapshots: PortfolioSnapshot[] = results.map((result, index) => {
      const previousPosition = index > 0 ? positions[index - 1] ?? null : null;
      return new PortfolioSnapshot(result.position, result.metadata, previousPosition);
    });

    // Calculate total return
    const totalReturn = this.analyticsService.calculateTotalReturnBrl(positions);

    // Export data if requested
    if (request.exportData && this.exportService) {
      this.exportService.exportPortfolioData(snapshots);
    }

    return {
      finalPosition,
      snapshots,
      totalOperations: operations.length,
      totalReturnBrl: totalReturn,
    };
  }
}
