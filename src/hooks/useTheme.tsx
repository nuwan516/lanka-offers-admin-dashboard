import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'lanka_offers_admin_theme';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Default to dark mode as requested
  return 'dark';
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const targetMode = mode === 'dark' ? Mode.Dark : Mode.Light;
  applyMode(targetMode, document.body);
  applyMode(targetMode, document.documentElement);

  if (mode === 'dark') {
    document.documentElement.classList.add('awsui-dark-mode');
    document.body.classList.add('awsui-dark-mode');
  } else {
    document.documentElement.classList.remove('awsui-dark-mode');
    document.body.classList.remove('awsui-dark-mode');
  }
}

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
    applyThemeMode(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
