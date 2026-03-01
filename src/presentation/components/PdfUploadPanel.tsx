import { type useFileUpload } from '@/presentation/hooks/useFileUpload';

type FileUploadReturn = ReturnType<typeof useFileUpload>;

interface PdfUploadPanelProps {
  fileUpload: FileUploadReturn;
}

export function PdfUploadPanel({ fileUpload }: PdfUploadPanelProps) {
  const {
    files,
    releaseFilesInputRef,
    releaseFolderInputRef,
    tradeFilesInputRef,
    tradeFolderInputRef,
    handleTradeFiles,
    handleReleaseFiles,
    openTradeFilesDialog,
    openTradeFolderDialog,
    openReleaseFilesDialog,
    openReleaseFolderDialog,
  } = fileUpload;

  return (
    <div className="animate-fade-in grid gap-4 sm:grid-cols-2">
      <FileDropZone
        label="PDFs de Confirmação de Vesting (Release)"
        count={files.releasePDFs.length}
        icon={
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        }
        filesInputRef={releaseFilesInputRef}
        folderInputRef={releaseFolderInputRef}
        onFileChange={handleReleaseFiles}
        onOpenFiles={openReleaseFilesDialog}
        onOpenFolder={openReleaseFolderDialog}
      />

      <FileDropZone
        label="PDFs de Confirmação de Venda (Trade)"
        count={files.tradePDFs.length}
        icon={
          <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        }
        filesInputRef={tradeFilesInputRef}
        folderInputRef={tradeFolderInputRef}
        onFileChange={handleTradeFiles}
        onOpenFiles={openTradeFilesDialog}
        onOpenFolder={openTradeFolderDialog}
      />
    </div>
  );
}

function FileDropZone({
  label,
  count,
  icon,
  filesInputRef,
  folderInputRef,
  onFileChange,
  onOpenFiles,
  onOpenFolder,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  filesInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFiles: () => void;
  onOpenFolder: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-5 transition-all dark:border-surface-700 dark:bg-surface-800/50">
      {/* Hidden inputs */}
      <input
        ref={filesInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={onFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={onFileChange}
        className="hidden"
        // @ts-expect-error — webkitdirectory is not in React's HTMLInputElement types
        webkitdirectory=""
        directory=""
      />

      {/* Header row */}
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-700">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{label}</p>
          <p className="text-xs text-surface-400">Selecione arquivos individuais ou uma pasta</p>
        </div>
        {count > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            {count} arquivo{count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onOpenFiles}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Selecionar arquivos
        </button>
        <button
          type="button"
          onClick={onOpenFolder}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-xs font-medium text-surface-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/30 dark:hover:text-brand-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Selecionar pasta
        </button>
      </div>
    </div>
  );
}
