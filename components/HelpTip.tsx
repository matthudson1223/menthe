import React, { useState, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';

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
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:max-w-sm bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-3 shadow-lg z-30 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Lightbulb size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-blue-900 dark:text-blue-200">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
        aria-label="Close tip"
      >
        <X size={16} />
      </button>
    </div>
  );
};
