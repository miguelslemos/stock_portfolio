import { useEffect, useRef, useCallback, useId, useContext, createContext, type ReactNode } from 'react';

const ModalTitleContext = createContext<string | undefined>(undefined);

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  large?: boolean;
}

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ children, onClose, large }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        className={`relative w-full animate-slide-in rounded-2xl border border-surface-200 bg-surface-0 shadow-2xl dark:border-surface-700 dark:bg-surface-900 ${
          large ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        <ModalTitleContext.Provider value={titleId}>
          {children}
        </ModalTitleContext.Provider>
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  const titleId = useContext(ModalTitleContext);
  return (
    <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
      <h2 id={titleId} className="text-base font-bold text-surface-900 dark:text-surface-100">{title}</h2>
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

export function ModalBody({ children, maxHeight }: { children: ReactNode; maxHeight?: string }) {
  return <div className={`${maxHeight ?? 'max-h-[85vh]'} overflow-y-auto px-6 py-5`}>{children}</div>;
}
