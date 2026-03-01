import { useState, useCallback, useRef } from 'react';

interface FileUploadState {
  tradePDFs: File[];
  releasePDFs: File[];
  jsonFile: File | null;
}

export interface JsonValidationResult {
  status: 'idle' | 'valid' | 'warning' | 'error';
  validCount: number;
  errors: string[];
}

export interface UseFileUploadReturn {
  files: FileUploadState;
  hasData: boolean;
  jsonValidation: JsonValidationResult;
  tradeFilesInputRef: React.RefObject<HTMLInputElement | null>;
  tradeFolderInputRef: React.RefObject<HTMLInputElement | null>;
  releaseFilesInputRef: React.RefObject<HTMLInputElement | null>;
  releaseFolderInputRef: React.RefObject<HTMLInputElement | null>;
  jsonInputRef: React.RefObject<HTMLInputElement | null>;
  handleTradeFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleReleaseFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJsonFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openTradeFilesDialog: () => void;
  openTradeFolderDialog: () => void;
  openReleaseFilesDialog: () => void;
  openReleaseFolderDialog: () => void;
  openJsonDialog: () => void;
  clearAll: () => void;
  getUniqueFolders: (files: File[]) => Set<string>;
}

const DATE_PATTERN = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

function validateJsonContent(content: string): JsonValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { status: 'error', validCount: 0, errors: ['Arquivo não é um JSON válido.'] };
  }

  if (!Array.isArray(parsed)) {
    return { status: 'error', validCount: 0, errors: ['O JSON deve ser um array de operações.'] };
  }

  if (parsed.length === 0) {
    return { status: 'warning', validCount: 0, errors: ['O array está vazio.'] };
  }

  const errors: string[] = [];
  let validCount = 0;

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;
    const idx = i + 1;

    if (typeof item !== 'object' || item === null) {
      errors.push(`#${idx}: não é um objeto.`);
      continue;
    }

    const type = item['type'];
    const date = item['date'];
    const quantity = item['quantity'];
    const price = item['price'];

    if (type !== 'vesting' && type !== 'trade') {
      errors.push(`#${idx}: "type" deve ser "vesting" ou "trade" (encontrado: "${String(type)}").`);
      continue;
    }

    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      errors.push(`#${idx}: "date" inválida (use MM/DD/YYYY ou YYYY-MM-DD).`);
      continue;
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      errors.push(`#${idx}: "quantity" deve ser um inteiro >= 1.`);
      continue;
    }

    if (typeof price !== 'number' || price < 0) {
      errors.push(`#${idx}: "price" deve ser um número >= 0.`);
      continue;
    }

    validCount++;
  }

  if (errors.length > 0 && validCount > 0) {
    return { status: 'warning', validCount, errors };
  }
  if (errors.length > 0) {
    return { status: 'error', validCount: 0, errors };
  }
  return { status: 'valid', validCount, errors: [] };
}

const IDLE_VALIDATION: JsonValidationResult = { status: 'idle', validCount: 0, errors: [] };

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<FileUploadState>({
    tradePDFs: [],
    releasePDFs: [],
    jsonFile: null,
  });
  const [jsonValidation, setJsonValidation] = useState<JsonValidationResult>(IDLE_VALIDATION);

  const tradeFilesInputRef = useRef<HTMLInputElement | null>(null);
  const tradeFolderInputRef = useRef<HTMLInputElement | null>(null);
  const releaseFilesInputRef = useRef<HTMLInputElement | null>(null);
  const releaseFolderInputRef = useRef<HTMLInputElement | null>(null);
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

    if (!file) {
      setJsonValidation(IDLE_VALIDATION);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonValidation(validateJsonContent(content));
    };
    reader.onerror = () => {
      setJsonValidation({ status: 'error', validCount: 0, errors: ['Falha ao ler o arquivo.'] });
    };
    reader.readAsText(file);
  }, []);

  const openTradeFilesDialog = useCallback(() => {
    tradeFilesInputRef.current?.click();
  }, []);

  const openTradeFolderDialog = useCallback(() => {
    tradeFolderInputRef.current?.click();
  }, []);

  const openReleaseFilesDialog = useCallback(() => {
    releaseFilesInputRef.current?.click();
  }, []);

  const openReleaseFolderDialog = useCallback(() => {
    releaseFolderInputRef.current?.click();
  }, []);

  const openJsonDialog = useCallback(() => {
    jsonInputRef.current?.click();
  }, []);

  const clearAll = useCallback(() => {
    setFiles({ tradePDFs: [], releasePDFs: [], jsonFile: null });
    setJsonValidation(IDLE_VALIDATION);
    if (tradeFilesInputRef.current) tradeFilesInputRef.current.value = '';
    if (tradeFolderInputRef.current) tradeFolderInputRef.current.value = '';
    if (releaseFilesInputRef.current) releaseFilesInputRef.current.value = '';
    if (releaseFolderInputRef.current) releaseFolderInputRef.current.value = '';
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
    jsonValidation,
    tradeFilesInputRef,
    tradeFolderInputRef,
    releaseFilesInputRef,
    releaseFolderInputRef,
    jsonInputRef,
    handleTradeFiles,
    handleReleaseFiles,
    handleJsonFile,
    openTradeFilesDialog,
    openTradeFolderDialog,
    openReleaseFilesDialog,
    openReleaseFolderDialog,
    openJsonDialog,
    clearAll,
    getUniqueFolders,
  };
}
