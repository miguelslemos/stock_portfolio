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

  static format(value: number, decimals: 2 | 4 = 2): string {
    const formatter = decimals === 4 ? this.formatter4 : this.formatter2;
    if (value < 0) {
      const positive = formatter.format(Math.abs(value));
      return positive.replace(/^(R\$)\s*/, '$1 -');
    }
    return formatter.format(value);
  }

  static formatWithPrecision(value: number): string {
    return this.format(value, 4);
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

  static format(value: number, decimals: 2 | 4 = 2): string {
    const formatter = decimals === 4 ? this.formatter4 : this.formatter2;
    return formatter.format(value);
  }

  static formatWithPrecision(value: number): string {
    return this.format(value, 4);
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

