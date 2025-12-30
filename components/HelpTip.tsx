import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface HelpTipProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: number;
}

export const HelpTip: React.FC<HelpTipProps> = ({ message, action, autoClose = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => setIsVisible(false), autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-5 md:left-5 md:right-auto md:max-w-xs bg-slate-800 dark:bg-slate-700 text-white rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg z-30 text-sm">
      <span className="flex-1">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-300 hover:text-blue-200 font-medium text-xs"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => setIsVisible(false)}
        className="text-slate-400 hover:text-white transition-colors p-0.5"
        aria-label="Close tip"
      >
        <X size={14} />
      </button>
    </div>
  );
};
