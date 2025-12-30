import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '../constants';

interface KeyboardShortcutHandlers {
  onNewNote?: () => void;
  onSearch?: () => void;
  onToggleTheme?: () => void;
  onSave?: () => void;
  onOpenCommandPalette?: () => void;
  onShowShortcuts?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur inputs
        if (event.key === KEYBOARD_SHORTCUTS.ESCAPE) {
          target.blur();
        }
        return;
      }

      // Check for modifier keys (Cmd/Ctrl)
      const isMod = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl + N: New Note
      if (isMod && event.key === KEYBOARD_SHORTCUTS.NEW_NOTE) {
        event.preventDefault();
        handlers.onNewNote?.();
      }

      // Cmd/Ctrl + S: Save
      if (isMod && event.key === KEYBOARD_SHORTCUTS.SAVE) {
        event.preventDefault();
        handlers.onSave?.();
      }

      // /: Focus search
      if (event.key === KEYBOARD_SHORTCUTS.SEARCH && !isMod) {
        event.preventDefault();
        handlers.onSearch?.();
      }

      // Cmd/Ctrl + T: Toggle theme
      if (isMod && event.key === KEYBOARD_SHORTCUTS.TOGGLE_THEME) {
        event.preventDefault();
        handlers.onToggleTheme?.();
      }

      // Cmd/Ctrl + K: Open command palette
      if (isMod && event.key === 'k') {
        event.preventDefault();
        handlers.onOpenCommandPalette?.();
      }

      // ?: Show shortcuts
      if (event.key === '?' && !isMod) {
        event.preventDefault();
        handlers.onShowShortcuts?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
