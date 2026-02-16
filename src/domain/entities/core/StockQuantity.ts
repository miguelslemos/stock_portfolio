export class StockQuantity {
  constructor(public readonly value: number) {
    if (value < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    if (!Number.isInteger(value)) {
      throw new Error('Stock quantity must be an integer');
    }
  }

  toString(): string {
    return this.value.toString();
  }

  add(other: StockQuantity): StockQuantity {
    return new StockQuantity(this.value + other.value);
  }

  subtract(other: StockQuantity): StockQuantity {
    return new StockQuantity(this.value - other.value);
  }
}

