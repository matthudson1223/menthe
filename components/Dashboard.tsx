import React, { useState } from 'react';
import { BrainCircuit, FileText, Moon, Sun, Mic, Zap } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { NoteStats } from './NoteStats';
import { SearchFilters } from './SearchFilters';
import { Input } from './ui';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { CommandPalette } from './CommandPalette';
import { useNotesContext } from '../context/NotesContext';
import { useKeyboardShortcuts } from '../hooks';
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
  const { notes, theme, chat } = useNotesContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onNewNote: onCreateNote,
    onToggleTheme: theme.toggleTheme,
    onSearch: () => searchInputRef.current?.focus(),
    onOpenCommandPalette: () => setShowCommandPalette(true),
    onShowShortcuts: () => setShowShortcuts(true),
  });

  const commands = [
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a fresh note',
      action: onCreateNote,
      icon: <FileText size={18} />,
      shortcut: '⌘N',
      category: 'Notes',
    },
    {
      id: 'search',
      label: 'Search Notes',
      description: 'Find your notes quickly',
      action: () => searchInputRef.current?.focus(),
      icon: <Input size={18} />,
      shortcut: '/',
      category: 'Navigation',
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      action: theme.toggleTheme,
      icon: theme.darkMode ? <Sun size={18} /> : <Moon size={18} />,
      shortcut: '⌘T',
      category: 'Settings',
    },
    {
      id: 'open-chat',
      label: 'Open AI Chat',
      description: 'Chat with Gemini Assistant',
      action: () => chat.setIsChatOpen(true),
      icon: <Zap size={18} />,
      shortcut: '⌘K then chat',
      category: 'AI',
    },
  ];

  const filteredNotes = React.useMemo(() => {
    let result = notes.notes;

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.summaryText.toLowerCase().includes(query) ||
        note.verbatimText.toLowerCase().includes(query) ||
        note.userNotes?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (selectedFilters.length > 0) {
      result = result.filter(note => {
        return selectedFilters.every(filter => {
          if (filter === 'summary') return !!note.summaryText;
          if (filter === 'transcript') return !!note.verbatimText;
          if (filter === 'audio') return note.type === 'audio';
          if (filter === 'image') return note.type === 'image';
          return true;
        });
      });
    }

    return result;
  }, [notes.notes, searchQuery, selectedFilters]);

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
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            My Notes {searchQuery && `(${filteredNotes.length} results)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Show keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
          >
            <span className="text-sm font-medium">?</span>
          </button>
          <button
            onClick={theme.toggleTheme}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label={ARIA_LABELS.TOGGLE_THEME}
          >
            {theme.darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {notes.notes.length > 0 && (
          <NoteStats notes={notes.notes} filteredCount={filteredNotes.length} />
        )}

        <div className="relative mb-2">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search notes... (Cmd/Ctrl + /)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label={ARIA_LABELS.SEARCH_NOTES}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500">
            🔍
          </span>
        </div>
        {notes.notes.length > 0 && (
          <SearchFilters
            selectedFilters={selectedFilters}
            onFilterChange={setSelectedFilters}
          />
        )}

        {filteredNotes.length === 0 ? (
          notes.notes.length === 0 ? (
            <div className="text-center py-24 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-dashed border-blue-200 dark:border-slate-700 transition-colors">
              <div className="mx-auto w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-lg">
                <FileText size={40} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Ready to capture your thoughts?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Create your first note to get started. You can:
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 mb-6 inline-block text-left">
                <li>✍️ Write notes manually</li>
                <li>🎙️ Record audio and auto-transcribe</li>
                <li>📷 Upload images for analysis</li>
                <li>🤖 Use AI to summarize and extract insights</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onCreateNote}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create First Note
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Learn Shortcuts
                </button>
              </div>
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-20">
        <button
          onClick={() => chat.setIsChatOpen(true)}
          className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-purple-700 hover:scale-105 transition-all group relative"
          aria-label="Open AI chat"
          title="Open AI chat (⌘K)"
        >
          <Zap size={24} />
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with AI
          </span>
        </button>
        <button
          onClick={onCreateNote}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all group relative"
          aria-label={ARIA_LABELS.NEW_NOTE}
          title="New note (⌘N)"
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
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            New note
          </span>
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
