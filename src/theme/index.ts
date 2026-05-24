import { ThemeColors, lightColors, darkColors, spacing, radius, fontScale } from './colors';

export { lightColors, darkColors, spacing, radius, fontScale };
export type { ThemeColors };

export function getTheme(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}

export const typography = {
  displayKanji: {
    fontFamily: 'NotoSerifJP_400Regular',
    fontSize: 80,
    lineHeight: 96,
    letterSpacing: 4,
  },
  headlineLg: {
    fontFamily: 'BeVietnamPro_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  headlineMd: {
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
  },
  bodyLg: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  labelSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.24,
  },
} as const;

export function scaledFontSize(base: number, scale: keyof typeof fontScale): number {
  return Math.round(base * fontScale[scale]);
}
