import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Note } from '../../types';

interface TranscriptTabProps {
  note: Note;
  isFullWidth: boolean;
  onUpdate: (updates: Partial<Note>) => void;
}

export const TranscriptTab = React.memo<TranscriptTabProps>(({
  note,
  isFullWidth,
  onUpdate,
}) => {
  return (
    <div
      className={`mx-auto transition-all duration-300 ${
        isFullWidth ? 'w-full md:px-4' : 'max-w-2xl'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[50vh] transition-colors relative">
        <textarea
          value={note.verbatimText || ''}
          onChange={(e) => onUpdate({ verbatimText: e.target.value })}
          className="w-full h-[60vh] outline-none resize-none text-slate-700 dark:text-slate-200 bg-transparent font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
          placeholder={note.isProcessing ? '' : 'Transcript will appear here...'}
        />
        {/* Inline Loading State for Transcript */}
        {note.isProcessing && !note.verbatimText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3 backdrop-blur-sm">
              <Loader2 className="animate-spin text-blue-500" size={20} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Processing transcript...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TranscriptTab.displayName = 'TranscriptTab';
