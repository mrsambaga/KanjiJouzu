import React, { createContext, useContext, useMemo } from 'react';
import { getTheme, ThemeColors, typography, scaledFontSize } from '../theme';
import { useSettingsStore } from '../stores/settingsStore';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  typography: typeof typography;
  fontScale: 'small' | 'medium' | 'large';
  scaledFontSize: typeof scaledFontSize;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const isDark = darkMode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: getTheme(isDark),
      isDark,
      typography,
      fontScale: fontSize,
      scaledFontSize,
    }),
    [isDark, fontSize],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
