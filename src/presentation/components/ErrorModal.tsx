import { useEffect, useCallback } from 'react';
import { useAnalytics } from '@/presentation/hooks';
import { Modal, ModalHeader, ModalBody } from './Modal';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackEvent('error_modal_shown', { message: message.slice(0, 100) });
  }, [analytics, message]);

  const handleClose = useCallback(() => {
    analytics.trackEvent('error_modal_dismissed');
    onClose();
  }, [analytics, onClose]);

  return (
    <Modal onClose={handleClose}>
      <ModalHeader title="Não foi possível processar o portfólio" onClose={handleClose} />
      <ModalBody>
        <div className="space-y-4">
          {/* Error icon + message */}
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/10">
              <svg
                className="h-5 w-5 text-rose-600 dark:text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">Erro ao processar</p>
              <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{message}</p>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
              />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Verifique se todos os PDFs foram carregados corretamente e se as operações de vesting cobrem as datas de venda.
            </p>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleClose}
              className="rounded-xl bg-surface-100 px-5 py-2.5 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
            >
              Fechar e tentar novamente
            </button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
