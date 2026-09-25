import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id="global-dark-mode-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center rounded-xl p-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
        isDark
          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-slate-700/80 shadow-xs'
          : 'bg-white/80 text-slate-700 hover:bg-white hover:text-primary-900 border border-slate-200/90 shadow-xs'
      } ${className}`}
    >
      <span className="flex items-center gap-1.5">
        {isDark ? (
          <Sun size={17} className="transition-transform duration-300 rotate-0 text-amber-300" />
        ) : (
          <Moon size={17} className="transition-transform duration-300 rotate-0 text-slate-700" />
        )}
        {showLabel && (
          <span className="text-xs font-bold">
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </span>
    </button>
  );
}
