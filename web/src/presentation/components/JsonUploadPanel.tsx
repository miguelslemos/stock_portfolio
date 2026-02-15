import { useState, useCallback } from 'react';
import { type useFileUpload } from '@/presentation/hooks/useFileUpload';

type FileUploadReturn = ReturnType<typeof useFileUpload>;

interface JsonUploadPanelProps {
  fileUpload: FileUploadReturn;
}

export function JsonUploadPanel({ fileUpload }: JsonUploadPanelProps) {
  const { files, jsonInputRef, handleJsonFile, openJsonDialog } = fileUpload;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* File selector */}
      <div
        onClick={openJsonDialog}
        className="group cursor-pointer rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-5 transition-all hover:border-brand-400 hover:bg-brand-50/30 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/20"
      >
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleJsonFile}
          className="hidden"
        />
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 transition-colors group-hover:bg-brand-100 dark:bg-surface-700 dark:group-hover:bg-brand-900/30">
            <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
              Arquivo JSON de Operações
            </p>
            <p className="text-xs text-surface-400">Formato: array de objetos com type, date, quantity, price</p>
          </div>
          {files.jsonFile ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              {files.jsonFile.name}
            </span>
          ) : (
            <span className="text-xs text-surface-300 transition-colors group-hover:text-brand-500 dark:text-surface-500">
              Selecionar
            </span>
          )}
        </div>
      </div>

      {/* Schema section */}
      <JsonSchemaInline />
    </div>
  );
}

/* ===== Inline JSON Schema ===== */

function JsonSchemaInline() {
  const [tab, setTab] = useState<'example' | 'schema'>('example');
  const [copyLabel, setCopyLabel] = useState('Copiar');
  const content = tab === 'schema' ? getJSONSchema() : getJSONExample();

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopyLabel('Copiado!');
    setTimeout(() => setCopyLabel('Copiar'), 2000);
  }, [content]);

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-700">
        <div className="flex">
          {(['example', 'schema'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
              }`}
            >
              {t === 'example' ? 'Exemplo' : 'Schema'}
            </button>
          ))}
        </div>
        <button
          onClick={() => void handleCopy()}
          className="mr-3 rounded-md bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
        >
          {copyLabel}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto p-4 text-xs leading-relaxed text-surface-700 dark:text-surface-300">
        {content}
      </pre>
    </div>
  );
}

function getJSONSchema(): string {
  return JSON.stringify(
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      description: 'Lista de operações de portfólio (vesting ou trade)',
      items: {
        oneOf: [
          {
            type: 'object',
            description: 'Operação de Vesting',
            required: ['type', 'date', 'quantity', 'price'],
            properties: {
              type: { const: 'vesting' },
              date: { type: 'string', format: 'date' },
              quantity: { type: 'integer', minimum: 1 },
              price: { type: 'number', minimum: 0, description: 'Preço por ação em USD' },
            },
          },
          {
            type: 'object',
            description: 'Operação de Trade',
            required: ['type', 'date', 'quantity', 'price'],
            properties: {
              type: { const: 'trade' },
              date: { type: 'string', format: 'date' },
              settlement_date: { type: 'string', format: 'date' },
              quantity: { type: 'integer', minimum: 1 },
              price: { type: 'number', minimum: 0 },
            },
          },
        ],
      },
    },
    null,
    2
  );
}

function getJSONExample(): string {
  return JSON.stringify(
    [
      { type: 'vesting', date: '2023-01-15', quantity: 100, price: 8.5 },
      { type: 'vesting', date: '2023-04-15', quantity: 100, price: 9.2 },
      { type: 'trade', date: '2023-06-10', settlement_date: '2023-06-12', quantity: 50, price: 10.75 },
      { type: 'vesting', date: '2023-07-15', quantity: 100, price: 11.0 },
      { type: 'trade', date: '2023-12-20', settlement_date: '2023-12-22', quantity: 150, price: 12.5 },
    ],
    null,
    2
  );
}
