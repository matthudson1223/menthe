import React from 'react';
import { Textarea } from '../ui';
import type { Note } from '../../types';

interface NoteTabProps {
  note: Note;
  isFullWidth: boolean;
  onUpdate: (updates: Partial<Note>) => void;
}

export const NoteTab = React.memo<NoteTabProps>(({ note, isFullWidth, onUpdate }) => {
  return (
    <div
      className={`mx-auto transition-all duration-300 ${
        isFullWidth ? 'w-full md:px-4' : 'max-w-2xl'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[50vh] transition-colors">
        <textarea
          value={note.userNotes || ''}
          onChange={(e) => onUpdate({ userNotes: e.target.value })}
          className="w-full h-[60vh] outline-none resize-none text-slate-700 dark:text-slate-200 bg-transparent font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
          placeholder="Type your personal notes and observations here..."
        />
      </div>
    </div>
  );
});

NoteTab.displayName = 'NoteTab';
