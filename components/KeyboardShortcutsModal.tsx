import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_INFO = [
  { key: 'Cmd/Ctrl + N', action: 'Create new note', icon: '✍️' },
  { key: 'Cmd/Ctrl + T', action: 'Toggle dark mode', icon: '🌙' },
  { key: 'Cmd/Ctrl + K', action: 'Open command palette', icon: '⌘' },
  { key: 'Cmd/Ctrl + /', action: 'Focus search', icon: '🔍' },
  { key: 'Escape', action: 'Close modals / Go back', icon: '◀️' },
];

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Keyboard className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 id="shortcuts-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close shortcuts"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {SHORTCUTS_INFO.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{shortcut.icon}</span>
                <span className="text-slate-700 dark:text-slate-300 text-sm">
                  {shortcut.action}
                </span>
              </div>
              <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Press <kbd className="inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono mx-1">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};
