import { useAnalytics } from '@/presentation/hooks';
import { useCallback } from 'react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  const analytics = useAnalytics();

  const handleToggleTheme = useCallback(() => {
    analytics.trackEvent('theme_toggled', { theme: isDark ? 'light' : 'dark' });
    onToggleTheme();
  }, [analytics, isDark, onToggleTheme]);
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 px-6 py-10 text-white sm:px-10 sm:py-14">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1z'/%3E%3Cpath d='M0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient orb decorations */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

      {/* Theme toggle */}
      <button
        onClick={handleToggleTheme}
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm backdrop-blur-sm transition-all hover:bg-white/20"
        aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Logo / Title */}
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
          NU Holdings — Stock Portfolio
        </div>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Gestão de Portfólio
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
          Calcule impostos, acompanhe operações e gere relatórios para o IRPF automaticamente.
        </p>

        {/* Privacy pill */}
        <div className="mx-auto mt-8 flex max-w-lg items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-5 py-3 text-left backdrop-blur-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
            <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <p className="text-sm leading-snug text-white/80">
            <strong className="text-white">Processamento 100% local.</strong>{' '}
            Seus PDFs são processados no navegador. Dados financeiros nunca são enviados para o servidor.
          </p>
        </div>
      </div>
    </header>
  );
}
