import React, { useEffect } from 'react';
import { X, FileText, Moon, Command, Search, ArrowLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_INFO = [
  { key: 'Ctrl + N', action: 'Create new note', icon: FileText },
  { key: 'Ctrl + T', action: 'Toggle dark mode', icon: Moon },
  { key: 'Ctrl + K', action: 'Command palette', icon: Command },
  { key: 'Ctrl + /', action: 'Focus search', icon: Search },
  { key: 'Escape', action: 'Close / Go back', icon: ArrowLeft },
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 id="shortcuts-title" className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            aria-label="Close shortcuts"
          >
            <X size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-3 space-y-1">
          {SHORTCUTS_INFO.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div key={shortcut.key} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm">
                    {shortcut.action}
                  </span>
                </div>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                  {shortcut.key}
                </kbd>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
