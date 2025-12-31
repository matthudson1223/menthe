import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { storageService } from '../services/storageService';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';
import type { AppSettings, ThemeMode, ExportDefaults } from '../types';

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateExportDefault: <K extends keyof ExportDefaults>(key: K, value: ExportDefaults[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    themeMode: DEFAULT_SETTINGS.themeMode,
    exportDefaults: { ...DEFAULT_SETTINGS.exportDefaults },
  });
  const [loading, setLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await storageService.getSettings();
        if (saved) {
          setSettings({
            themeMode: saved.themeMode ?? DEFAULT_SETTINGS.themeMode,
            exportDefaults: {
              ...DEFAULT_SETTINGS.exportDefaults,
              ...saved.exportDefaults,
            },
            apiKey: saved.apiKey,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to storage whenever they change
  useEffect(() => {
    if (!loading) {
      storageService.saveSettings(settings);
    }
  }, [settings, loading]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateExportDefault = useCallback(<K extends keyof ExportDefaults>(
    key: K,
    value: ExportDefaults[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      exportDefaults: {
        ...prev.exportDefaults,
        [key]: value,
      },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({
      themeMode: DEFAULT_SETTINGS.themeMode,
      exportDefaults: { ...DEFAULT_SETTINGS.exportDefaults },
    });
  }, []);

  const value: SettingsContextValue = {
    settings,
    loading,
    updateSetting,
    updateExportDefault,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
