import { useState, useCallback, useRef } from 'react';

interface FileUploadState {
  tradePDFs: File[];
  releasePDFs: File[];
  jsonFile: File | null;
}

interface UseFileUploadReturn {
  files: FileUploadState;
  hasData: boolean;
  tradeInputRef: React.RefObject<HTMLInputElement | null>;
  releaseInputRef: React.RefObject<HTMLInputElement | null>;
  jsonInputRef: React.RefObject<HTMLInputElement | null>;
  handleTradeFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleReleaseFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJsonFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openTradeDialog: () => void;
  openReleaseDialog: () => void;
  openJsonDialog: () => void;
  clearAll: () => void;
  getUniqueFolders: (files: File[]) => Set<string>;
}

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<FileUploadState>({
    tradePDFs: [],
    releasePDFs: [],
    jsonFile: null,
  });

  const tradeInputRef = useRef<HTMLInputElement | null>(null);
  const releaseInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const handleTradeFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files ?? []);
    const pdfs = allFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    setFiles((prev) => ({ ...prev, tradePDFs: pdfs }));
  }, []);

  const handleReleaseFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files ?? []);
    const pdfs = allFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    setFiles((prev) => ({ ...prev, releasePDFs: pdfs }));
  }, []);

  const handleJsonFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFiles((prev) => ({ ...prev, jsonFile: file }));
  }, []);

  const openTradeDialog = useCallback(() => {
    tradeInputRef.current?.click();
  }, []);

  const openReleaseDialog = useCallback(() => {
    releaseInputRef.current?.click();
  }, []);

  const openJsonDialog = useCallback(() => {
    jsonInputRef.current?.click();
  }, []);

  const clearAll = useCallback(() => {
    setFiles({ tradePDFs: [], releasePDFs: [], jsonFile: null });
    if (tradeInputRef.current) tradeInputRef.current.value = '';
    if (releaseInputRef.current) releaseInputRef.current.value = '';
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  }, []);

  const getUniqueFolders = useCallback((fileList: File[]): Set<string> => {
    const folders = new Set<string>();
    fileList.forEach((file) => {
      const path = file.webkitRelativePath || file.name;
      const folder = path.substring(0, path.lastIndexOf('/'));
      if (folder) folders.add(folder);
    });
    return folders;
  }, []);

  const hasData =
    files.tradePDFs.length > 0 || files.releasePDFs.length > 0 || files.jsonFile !== null;

  return {
    files,
    hasData,
    tradeInputRef,
    releaseInputRef,
    jsonInputRef,
    handleTradeFiles,
    handleReleaseFiles,
    handleJsonFile,
    openTradeDialog,
    openReleaseDialog,
    openJsonDialog,
    clearAll,
    getUniqueFolders,
  };
}
