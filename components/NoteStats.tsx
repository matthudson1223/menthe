import React from 'react';
import type { Note } from '../types';

interface NoteStatsProps {
  notes: Note[];
  filteredCount: number;
}

export const NoteStats: React.FC<NoteStatsProps> = ({ notes, filteredCount }) => {
  const notesWithSummary = notes.filter(n => !!n.summaryText).length;
  const audioNotes = notes.filter(n => n.type === 'audio').length;

  return (
    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
      <span>{notesWithSummary} summarized</span>
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <span>{audioNotes} audio</span>
    </div>
  );
};
