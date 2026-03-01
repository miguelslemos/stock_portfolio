import { useState, useCallback, useRef } from 'react';
import { useAnalytics } from './useAnalytics';
import { PortfolioSnapshot } from '@/domain/entities';
import { getErrorMessage } from '@/domain/errors';
import {
  ProcessPortfolioUseCase,
  type ProcessPortfolioResponse,
} from '@/application/usecases';
import { PortfolioCalculationService, PortfolioAnalyticsService } from '@/domain/services';
import { BCBExchangeRateService, CSVExportService } from '@/infrastructure/services';
import {
  JSONOperationRepository,
  PDFOperationRepository,
  CompositeOperationRepository,
} from '@/infrastructure/repositories';
import { type IOperationRepository } from '@/application/interfaces';

export interface PortfolioState {
  status: 'idle' | 'loading' | 'success' | 'error';
  response: ProcessPortfolioResponse | null;
  snapshots: PortfolioSnapshot[];
  error: string | null;
  progress: { current: number; total: number; message: string } | null;
}

interface UsePortfolioReturn {
  state: PortfolioState;
  processPortfolio: (params: ProcessParams) => Promise<void>;
  cancelProcessing: () => void;
  reset: () => void;
}

export interface ProcessParams {
  tradePDFs: File[];
  releasePDFs: File[];
  jsonFile: File | null;
  manualEntriesJSON: string | null;
  exportData?: boolean;
}

const initialState: PortfolioState = {
  status: 'idle',
  response: null,
  snapshots: [],
  error: null,
  progress: null,
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function usePortfolio(): UsePortfolioReturn {
  const [state, setState] = useState<PortfolioState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analytics = useAnalytics();

  const cancelProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState(initialState);
  }, []);

  const processPortfolio = useCallback(async (params: ProcessParams) => {
    const { tradePDFs, releasePDFs, jsonFile, manualEntriesJSON, exportData = false } = params;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: null,
        progress: { current: 0, total: 3, message: 'Inicializando...' },
      }));

      const repositories: IOperationRepository[] = [];
      const totalSteps = 3;
      let currentStep = 0;

      // Step 1: Load manual entries
      if (manualEntriesJSON) {
        setState((prev) => ({
          ...prev,
          progress: { current: currentStep, total: totalSteps, message: 'Carregando entradas manuais...' },
        }));
        repositories.push(new JSONOperationRepository(manualEntriesJSON));
        currentStep++;
      }

      // Step 2: Load JSON file
      if (jsonFile) {
        setState((prev) => ({
          ...prev,
          progress: { current: currentStep, total: totalSteps, message: 'Carregando arquivo JSON...' },
        }));
        const jsonContent = await readFileAsText(jsonFile);
        repositories.push(new JSONOperationRepository(jsonContent));
        currentStep++;
      }

      // Step 3: Load PDFs
      if (tradePDFs.length > 0 || releasePDFs.length > 0) {
        const totalPDFs = tradePDFs.length + releasePDFs.length;
        setState((prev) => ({
          ...prev,
          progress: { current: currentStep, total: totalSteps, message: `Carregando ${totalPDFs} PDFs...` },
        }));
        const pdfRepo = new PDFOperationRepository(
          tradePDFs,
          releasePDFs,
          (current, total) => {
            setState((prev) => ({
              ...prev,
              progress: { current: currentStep, total: totalSteps, message: `Processando PDFs: ${current}/${total}` },
            }));
          },
          (error, fileName) => {
            analytics.trackException(error, `PDFRepository:${fileName}`);
          }
        );
        repositories.push(pdfRepo);
        currentStep++;
      }

      // Step 4: Process
      setState((prev) => ({
        ...prev,
        progress: { current: currentStep, total: totalSteps, message: 'Calculando portfólio e buscando cotações PTAX...' },
      }));

      const operationRepository = new CompositeOperationRepository(repositories);
      const exchangeRateService = new BCBExchangeRateService();
      const calculationService = new PortfolioCalculationService(exchangeRateService);
      const analyticsService = new PortfolioAnalyticsService();
      const exportService = exportData ? new CSVExportService() : undefined;

      const useCase = new ProcessPortfolioUseCase(
        operationRepository,
        calculationService,
        analyticsService,
        exportService
      );

      const response = await useCase.execute({ exportData });

      if (controller.signal.aborted) return;

      setState({
        status: 'success',
        response,
        snapshots: response.snapshots,
        error: null,
        progress: null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const err = error instanceof Error ? error : new Error(getErrorMessage(error));
      analytics.trackException(err, 'ProcessPortfolioUseCase');
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: getErrorMessage(error),
        progress: null,
      }));
    }
  }, [analytics]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { state, processPortfolio, cancelProcessing, reset };
}
