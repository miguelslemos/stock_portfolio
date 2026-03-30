import {
  PortfolioPosition,
  OperationResult,
  ExchangeRate,
} from '../entities';
import { ExchangeRateError } from '../errors';
import { PortfolioOperation } from '../operations';
import { ExchangeRateService } from './ExchangeRateService';

/**
 * Service for portfolio calculations
 * 
 * Handles the execution of operations and manages portfolio state transitions.
 * Implements business rules like year-end profit reset.
 */
export class PortfolioCalculationService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * Execute a list of operations chronologically
   * 
   * @param operations - List of operations to execute
   * @param initialPosition - Starting position (optional)
   * @returns Object containing positions and results arrays
   */
  async executeOperations(
    operations: PortfolioOperation[],
    initialPosition?: PortfolioPosition
  ): Promise<{ positions: PortfolioPosition[]; results: OperationResult[] }> {
    if (operations.length === 0) {
      return { positions: [], results: [] };
    }

    // Sort operations chronologically
    const sortedOperations = [...operations].sort(
      (a, b) => a.getDate().getTime() - b.getDate().getTime()
    );

    // Initialize position
    let currentPosition =
      initialPosition ?? PortfolioPosition.createEmpty(sortedOperations[0]!.getDate());

    // Check if we need to reset profit for first operation
    if (initialPosition) {
      const firstOperationDate = sortedOperations[0]!.getDate();
      if (firstOperationDate.getFullYear() > currentPosition.lastUpdated.getFullYear()) {
        currentPosition = currentPosition.resetGrossProfitForNewYear();
      }
    }

    const positions: PortfolioPosition[] = [];
    const results: OperationResult[] = [];

    // Execute each operation
    for (const operation of sortedOperations) {
      const operationDate = operation.getDate();
      
      // Reset gross profit at year boundary
      if (
        positions.length > 0 &&
        operationDate.getFullYear() > currentPosition.lastUpdated.getFullYear()
      ) {
        currentPosition = currentPosition.resetGrossProfitForNewYear();
      }

      // Get exchange rate for operation date
      const exchangeRate = await this.getExchangeRateForOperation(operation);
      
      // Execute operation
      const result = operation.execute(currentPosition, exchangeRate);
      currentPosition = result.position;

      positions.push(currentPosition);
      results.push(result);
    }

    return { positions, results };
  }

  /**
   * Get exchange rate for an operation's date.
   * Implements fallback logic (tries up to 7 days back for weekends/holidays).
   */
  private async getExchangeRateForOperation(operation: PortfolioOperation): Promise<ExchangeRate> {
    const operationDate = operation.getDate();

    for (let daysBack = 0; daysBack <= 7; daysBack++) {
      const tryDate = new Date(operationDate);
      tryDate.setDate(tryDate.getDate() - daysBack);

      const rate = await this.exchangeRateService.getRate('USD', 'BRL', tryDate);
      if (rate !== null) {
        return rate;
      }
    }

    throw new ExchangeRateError(
      `Cotação PTAX USD/BRL não encontrada para ${operationDate.toLocaleDateString('pt-BR')} (buscado até 7 dias anteriores)`
    );
  }
}
