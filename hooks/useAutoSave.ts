import { useEffect, useRef } from 'react';
import { debounce } from '../utils/helpers';
import { APP_CONFIG } from '../constants';

/**
 * Custom hook for auto-saving with debouncing
 */
export function useAutoSave<T>(value: T, onSave: (value: T) => void, delay: number = APP_CONFIG.AUTO_SAVE_DEBOUNCE) {
  const isFirstRun = useRef(true);

  // Create a debounced save function
  const debouncedSave = useRef(
    debounce((val: T) => {
      onSave(val);
    }, delay)
  ).current;

  useEffect(() => {
    // Skip the first run to avoid saving on mount
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    debouncedSave(value);
  }, [value, debouncedSave]);
}
