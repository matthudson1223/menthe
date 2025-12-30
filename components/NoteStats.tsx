import React from 'react';
import { Zap, BarChart3 } from 'lucide-react';
import type { Note } from '../types';

interface NoteStatsProps {
  notes: Note[];
  filteredCount: number;
}

export const NoteStats: React.FC<NoteStatsProps> = ({ notes, filteredCount }) => {
  const totalNotes = notes.length;
  const notesWithSummary = notes.filter(n => !!n.summaryText).length;
  const notesWithTags = notes.filter(n => n.tags && n.tags.length > 0).length;
  const audioNotes = notes.filter(n => n.type === 'audio').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 px-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {totalNotes}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Notes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {notesWithSummary}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Summarized</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {audioNotes}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Audio</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {notesWithTags}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Tagged</div>
      </div>
    </div>
  );
};
