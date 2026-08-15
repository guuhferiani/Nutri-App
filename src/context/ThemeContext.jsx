import { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContextInstance';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Checa preferência salva no localStorage
    const saved = localStorage.getItem('nutriapp_theme');
    if (saved === 'dark' || saved === 'light') return saved;

    // 2. Checa preferência do sistema operacional
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    // Aplica o atributo data-theme no elemento <html>
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nutriapp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
