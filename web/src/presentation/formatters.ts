export class BRLFormatter {
  private static readonly formatter2 = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private static readonly formatter4 = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  static format(value: number, decimals: number = 2): string {
    const formatter = decimals === 4 ? this.formatter4 : this.formatter2;
    return formatter.format(value);
  }

  static formatWithPrecision(value: number): string {
    // Use 4 decimals if value has significant fractional part
    const needsHighPrecision = Math.abs(value - Math.floor(value)) > 0.01;
    return this.format(value, needsHighPrecision ? 4 : 2);
  }
}

export class USDFormatter {
  private static readonly formatter2 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private static readonly formatter4 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  static format(value: number, decimals: number = 2): string {
    const formatter = decimals === 4 ? this.formatter4 : this.formatter2;
    return formatter.format(value);
  }

  static formatWithPrecision(value: number): string {
    // Use 4 decimals if value has significant fractional part
    const needsHighPrecision = Math.abs(value - Math.floor(value)) > 0.01;
    return this.format(value, needsHighPrecision ? 4 : 2);
  }
}

export class DateFormatter {
  static format(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  static formatLong(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}

