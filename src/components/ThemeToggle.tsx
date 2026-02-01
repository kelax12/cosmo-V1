import React, { memo } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = React.useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Theme switching logic (currently always dark)
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors ${className}`}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-400" />
      )}
    </button>
  );
};

export default memo(ThemeToggle);
