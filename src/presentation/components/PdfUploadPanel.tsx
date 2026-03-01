import { type useFileUpload } from '@/presentation/hooks/useFileUpload';

type FileUploadReturn = ReturnType<typeof useFileUpload>;

interface PdfUploadPanelProps {
  fileUpload: FileUploadReturn;
}

export function PdfUploadPanel({ fileUpload }: PdfUploadPanelProps) {
  const {
    files,
    tradeInputRef,
    releaseInputRef,
    handleTradeFiles,
    handleReleaseFiles,
    openTradeDialog,
    openReleaseDialog,
  } = fileUpload;

  return (
    <div className="space-y-4 animate-fade-in">
      <FileDropZone
        label="PDFs de Confirmação de Vesting (Release)"
        hint="Selecione a pasta ou arquivos individuais"
        count={files.releasePDFs.length}
        icon={
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
        }
        inputRef={releaseInputRef}
        onFileChange={handleReleaseFiles}
        onButtonClick={openReleaseDialog}
        accept=".pdf"
        directory
      />

      <FileDropZone
        label="PDFs de Confirmação de Venda (Trade)"
        hint="Selecione a pasta ou arquivos individuais"
        count={files.tradePDFs.length}
        icon={
          <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
          </svg>
        }
        inputRef={tradeInputRef}
        onFileChange={handleTradeFiles}
        onButtonClick={openTradeDialog}
        accept=".pdf"
        directory
      />
    </div>
  );
}

function FileDropZone({
  label,
  hint,
  count,
  icon,
  inputRef,
  onFileChange,
  onButtonClick,
  accept,
  directory,
}: {
  label: string;
  hint: string;
  count: number;
  icon: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onButtonClick: () => void;
  accept: string;
  directory?: boolean;
}) {
  const inputProps: Record<string, unknown> = {};
  if (directory) {
    inputProps['webkitdirectory'] = '';
    inputProps['directory'] = '';
  }

  return (
    <div
      onClick={onButtonClick}
      className="group cursor-pointer rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-5 transition-all hover:border-brand-400 hover:bg-brand-50/30 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/20"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={onFileChange}
        className="hidden"
        {...inputProps}
      />

      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 transition-colors group-hover:bg-brand-100 dark:bg-surface-700 dark:group-hover:bg-brand-900/30">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{label}</p>
          <p className="text-sm text-surface-400">{hint}</p>
        </div>
        {count > 0 ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {count} arquivo{count > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-sm text-surface-300 transition-colors group-hover:text-brand-500 dark:text-surface-500">
            Selecionar
          </span>
        )}
      </div>
    </div>
  );
}
