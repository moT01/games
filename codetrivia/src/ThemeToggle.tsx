import { useEffect, useState } from 'react';
import './ThemeToggle.css';

const THEME_KEY = 'codetrivia-theme';

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
