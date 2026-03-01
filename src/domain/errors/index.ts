export class ParseError extends Error {
  readonly code = 'PARSE_ERROR' as const;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class ExchangeRateError extends Error {
  readonly code = 'EXCHANGE_RATE_ERROR' as const;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExchangeRateError';
  }
}

export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export type DomainError = ParseError | ExchangeRateError | ValidationError;

export function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof ParseError ||
    error instanceof ExchangeRateError ||
    error instanceof ValidationError
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
}
