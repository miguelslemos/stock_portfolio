export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (!Number.isFinite(amount)) {
      throw new Error('Money amount must be a finite number');
    }
    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency is required');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add ${other.currency} to ${this.currency}`);
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot subtract ${other.currency} from ${this.currency}`);
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / divisor, this.currency);
  }
}

