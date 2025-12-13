import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';

interface ErrorDetails {
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

interface ErrorNotificationProps {
  error: ErrorDetails;
  onClose: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyErrorDetails = async () => {
    const details = `Error Report
Time: ${error.timestamp}
Message: ${error.message}

Context:
${JSON.stringify(error.context || {}, null, 2)}

${error.stack ? `Stack Trace:\n${error.stack}` : ''}

Browser: ${navigator.userAgent}`;

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = details;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <h3 className="font-semibold text-red-900">Error Occurred</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        <p className="text-red-800 mb-3 ml-8">{error.message}</p>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-8">
          <button
            onClick={copyErrorDetails}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded text-sm font-medium transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Details
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded text-sm font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show Details
              </>
            )}
          </button>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="mt-3 ml-8 p-3 bg-red-100 rounded text-xs font-mono overflow-auto max-h-64">
            <div className="space-y-2">
              <div>
                <strong className="text-red-900">Time:</strong>{' '}
                <span className="text-red-800">{error.timestamp}</span>
              </div>

              {error.context && Object.keys(error.context).length > 0 && (
                <div>
                  <strong className="text-red-900">Context:</strong>
                  <pre className="mt-1 text-red-800 whitespace-pre-wrap break-all">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              )}

              {error.stack && (
                <div>
                  <strong className="text-red-900">Stack:</strong>
                  <pre className="mt-1 text-red-800 whitespace-pre-wrap break-all text-[10px]">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
