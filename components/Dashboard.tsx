import React from 'react';
import { BrainCircuit, FileText, Moon, Sun } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { Input } from './ui';
import { useNotesContext } from '../context/NotesContext';
import { APP_CONFIG, ARIA_LABELS } from '../constants';
import type { Note, ViewType, TabType } from '../types';

interface DashboardProps {
  onNavigateToEditor: (
    note: Note,
    view: ViewType,
    tab: TabType,
    editingSummary: boolean
  ) => void;
  onCreateNote: () => void;
}

export const Dashboard = React.memo<DashboardProps>(({
  onNavigateToEditor,
  onCreateNote,
}) => {
  const { notes, theme } = useNotesContext();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredNotes = React.useMemo(() => {
    if (!searchQuery.trim()) return notes.notes;

    const query = searchQuery.toLowerCase();
    return notes.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.summaryText.toLowerCase().includes(query) ||
      note.verbatimText.toLowerCase().includes(query) ||
      note.userNotes?.toLowerCase().includes(query)
    );
  }, [notes.notes, searchQuery]);

  const handleNoteClick = (note: Note) => {
    notes.setActiveNote(note);
    onNavigateToEditor(note, 'editor', 'notes', false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-32">
      <header className="mb-8 flex justify-between items-center sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 py-4 transition-colors">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="text-blue-600 dark:text-blue-500" />
            {APP_CONFIG.APP_NAME}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">My Notes</p>
        </div>
        <button
          onClick={theme.toggleTheme}
          className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label={ARIA_LABELS.TOGGLE_THEME}
        >
          {theme.darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="space-y-4">
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label={ARIA_LABELS.SEARCH_NOTES}
          />
        </div>

        {filteredNotes.length === 0 ? (
          notes.notes.length === 0 ? (
            <div className="text-center py-24 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
              <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                <FileText size={32} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-2">No notes yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Tap the + button to create your first note.
              </p>
            </div>
          ) : (
            <div className="text-center py-24 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No notes found.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Try a different search term.
              </p>
            </div>
          )
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={handleNoteClick}
              onDelete={notes.deleteNote}
            />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onCreateNote}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all z-20"
        aria-label={ARIA_LABELS.NEW_NOTE}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
