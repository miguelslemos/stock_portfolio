import { useCallback, useMemo, type ChangeEvent } from 'react';

interface CurrencyInputProps {
  id?: string;
  currency: 'BRL' | 'USD';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  decimalPlaces?: number;
}

const SYMBOLS = { BRL: 'R$', USD: '$' } as const;

export function CurrencyInput({ id, currency, value, onChange, placeholder, decimalPlaces = 4 }: CurrencyInputProps) {
  const usesComma = currency === 'BRL';

  const displayValue = useMemo(
    () => (usesComma ? value.replace('.', ',') : value),
    [value, usesComma]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const normalized = raw.replace(/,/g, '.');
      const filtered = normalized.replace(/[^0-9.]/g, '');

      const parts = filtered.split('.');
      const sanitized = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : filtered;

      const dotIndex = sanitized.indexOf('.');
      if (dotIndex >= 0) {
        const integer = sanitized.slice(0, dotIndex);
        const decimal = sanitized.slice(dotIndex + 1);
        onChange(integer + '.' + decimal.slice(0, decimalPlaces));
      } else {
        onChange(sanitized);
      }
    },
    [onChange, decimalPlaces]
  );

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-surface-400 dark:text-surface-500">
        {SYMBOLS[currency]}
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-surface-200 bg-surface-0 py-2 pr-3 text-sm text-surface-900 transition-colors focus:border-brand-400 focus:ring-1 focus:ring-brand-400 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 pl-9"
      />
    </div>
  );
}
