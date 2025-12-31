import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { UseThemeReturn, ThemeMode } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

/**
 * Custom hook for managing theme (dark/light/system mode)
 */
export function useTheme(): UseThemeReturn {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_SETTINGS.themeMode);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Start with system preference
    return storageService.getSystemTheme() === 'dark';
  });
  const [initialized, setInitialized] = useState(false);

  // Calculate effective dark mode based on themeMode
  const calculateDarkMode = useCallback((mode: ThemeMode): boolean => {
    if (mode === 'system') {
      return storageService.getSystemTheme() === 'dark';
    }
    return mode === 'dark';
  }, []);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const settings = await storageService.getSettings();
      if (settings?.themeMode) {
        setThemeModeState(settings.themeMode);
        setDarkMode(calculateDarkMode(settings.themeMode));
      } else {
        // Fallback to legacy theme storage
        const saved = await storageService.getTheme();
        if (saved) {
          const mode: ThemeMode = saved;
          setThemeModeState(mode);
          setDarkMode(saved === 'dark');
        }
      }
      setInitialized(true);
    };
    loadTheme();
  }, [calculateDarkMode]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Apply theme to document and persist
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Only persist after initial load to avoid overwriting saved preference
    if (initialized) {
      // Save to legacy storage for backward compatibility
      storageService.saveTheme(darkMode ? 'dark' : 'light');
    }
  }, [darkMode, initialized]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    setDarkMode(calculateDarkMode(mode));
    // Settings context will handle persisting to settings storage
  }, [calculateDarkMode]);

  const toggleTheme = useCallback(() => {
    // When toggling, if we're in system mode, switch to the opposite of current effective theme
    // Otherwise just toggle between light and dark
    if (themeMode === 'system') {
      setThemeMode(darkMode ? 'light' : 'dark');
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  }, [themeMode, darkMode, setThemeMode]);

  return { darkMode, themeMode, toggleTheme, setThemeMode };
}
