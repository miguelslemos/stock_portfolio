import { Money, StockQuantity } from '../../domain/entities';
import { PortfolioOperation, VestingOperation, TradeOperation } from '../../domain/operations';
import { IOperationRepository } from '../../application/interfaces';
import { DateParser } from '../utils/DateParser';

interface JSONOperation {
  type: string;
  date: string;
  quantity: number;
  price: number;
  settlement_date?: string;
}

export class JSONOperationRepository implements IOperationRepository {
  constructor(private readonly jsonData: string) {}

  async getAllOperations(): Promise<PortfolioOperation[]> {
    try {
      const data = JSON.parse(this.jsonData) as JSONOperation[];
      return data.map((item) => this.createOperationFromObject(item));
    } catch (error) {
      throw new Error(`Failed to parse JSON operations: ${String(error)}`);
    }
  }

  private createOperationFromObject(data: JSONOperation): PortfolioOperation {
    const operationType = data.type.toLowerCase();
    const quantity = new StockQuantity(Math.floor(data.quantity));
    const price = new Money(data.price, 'USD');
    const date = DateParser.parse(data.date);
    const settlementDate = data.settlement_date ? DateParser.parse(data.settlement_date) : null;

    if (operationType === 'vesting') {
      return new VestingOperation(date, quantity, price, settlementDate);
    } else if (operationType === 'trade') {
      return new TradeOperation(date, quantity, price, settlementDate);
    } else {
      throw new Error(`Unsupported operation type: ${operationType}`);
    }
  }

}

