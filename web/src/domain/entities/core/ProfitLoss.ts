export class ProfitLoss {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (!currency) {
      throw new Error('Currency is required');
    }
  }

  toString(): string {
    return `${this.amount.toFixed(4)} ${this.currency}`;
  }

  add(other: ProfitLoss): ProfitLoss {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add ${other.currency} to ${this.currency}`);
    }
    return new ProfitLoss(this.amount + other.amount, this.currency);
  }
}

