import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { UseThemeReturn } from '../types';

/**
 * Custom hook for managing theme (dark/light mode)
 */
export function useTheme(): UseThemeReturn {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Start with system preference, then load saved preference async
    return storageService.getSystemTheme() === 'dark';
  });
  const [initialized, setInitialized] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await storageService.getTheme();
      if (saved) {
        setDarkMode(saved === 'dark');
      }
      setInitialized(true);
    };
    loadTheme();
  }, []);

  // Apply theme to document and persist
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Only persist after initial load to avoid overwriting saved preference
    if (initialized) {
      storageService.saveTheme(darkMode ? 'dark' : 'light');
    }
  }, [darkMode, initialized]);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  return { darkMode, toggleTheme };
}
