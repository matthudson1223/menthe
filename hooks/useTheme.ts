import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { UseThemeReturn } from '../types';

/**
 * Custom hook for managing theme (dark/light mode)
 */
export function useTheme(): UseThemeReturn {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = storageService.getTheme();
    if (saved) return saved === 'dark';
    return storageService.getSystemTheme() === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      storageService.saveTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      storageService.saveTheme('light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return { darkMode, toggleTheme };
}
