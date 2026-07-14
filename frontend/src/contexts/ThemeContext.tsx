import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Contrast = 'normal' | 'high';

interface ThemeContextType {
  theme: Theme;
  contrast: Contrast;
  toggleTheme: () => void;
  toggleContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('stadium-theme') as Theme) || 'dark';
  });

  const [contrast, setContrast] = useState<Contrast>(() => {
    return (localStorage.getItem('stadium-contrast') as Contrast) || 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('stadium-theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-contrast', contrast);
    localStorage.setItem('stadium-contrast', contrast);
  }, [contrast]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleContrast = () => {
    setContrast(prev => (prev === 'normal' ? 'high' : 'normal'));
  };

  return (
    <ThemeContext.Provider value={{ theme, contrast, toggleTheme, toggleContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
