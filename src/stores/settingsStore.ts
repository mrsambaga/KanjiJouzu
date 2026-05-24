import { create } from 'zustand';
import { initDatabase, loadAllSettings, setSetting } from '../db/database';
import { AppSettings } from '../types';

interface SettingsState extends AppSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDarkMode: (darkMode: boolean) => Promise<void>;
  setShowRomaji: (showRomaji: boolean) => Promise<void>;
  setFontSize: (fontSize: AppSettings['fontSize']) => Promise<void>;
  setOnboardingComplete: (onboardingComplete: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: false,
  showRomaji: true,
  fontSize: 'medium',
  onboardingComplete: false,
  hydrated: false,

  hydrate: async () => {
    await initDatabase();
    const settings = await loadAllSettings();
    set({ ...settings, hydrated: true });
  },

  setDarkMode: async (darkMode) => {
    await setSetting('darkMode', darkMode);
    set({ darkMode });
  },

  setShowRomaji: async (showRomaji) => {
    await setSetting('showRomaji', showRomaji);
    set({ showRomaji });
  },

  setFontSize: async (fontSize) => {
    await setSetting('fontSize', fontSize);
    set({ fontSize });
  },

  setOnboardingComplete: async (onboardingComplete) => {
    await setSetting('onboardingComplete', onboardingComplete);
    set({ onboardingComplete });
  },
}));
