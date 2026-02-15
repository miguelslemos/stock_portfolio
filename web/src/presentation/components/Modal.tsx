import { useEffect, useRef, useCallback, type ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  large?: boolean;
}

export function Modal({ children, onClose, large }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface-950/60 p-4 backdrop-blur-sm md:items-center md:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full animate-slide-in rounded-2xl border border-surface-200 bg-surface-0 shadow-2xl dark:border-surface-700 dark:bg-surface-900 ${
          large ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
      <h2 className="text-base font-bold text-surface-900 dark:text-surface-100">{title}</h2>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
        aria-label="Fechar"
        autoFocus
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>;
}
