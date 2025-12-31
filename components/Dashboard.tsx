import React, { useState } from 'react';
import { FileText, Moon, Sun, Mic, Zap, Search, Edit3, Image, Cpu, HelpCircle, CheckSquare, Square, FolderInput, Download, Trash, X } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { TrashNoteCard } from './TrashNoteCard';
import { NoteStats } from './NoteStats';
import { SearchFilters } from './SearchFilters';
import { SideMenu } from './SideMenu';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { CommandPalette } from './CommandPalette';
import { Modal } from './ui';
import { useNotesContext } from '../context/NotesContext';
import { useKeyboardShortcuts } from '../hooks';
import { APP_CONFIG, ARIA_LABELS, FILTER_UNTAGGED, FILTER_TRASH } from '../constants';
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
  const { notes, theme, chat, folders } = useNotesContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = React.useState<string[]>([]);
  const [showMoveToFolder, setShowMoveToFolder] = React.useState(false);
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
      shortcut: 'Ctrl+N',
      category: 'Notes',
    },
    {
      id: 'search',
      label: 'Search Notes',
      description: 'Find your notes quickly',
      action: () => searchInputRef.current?.focus(),
      icon: <Search size={18} />,
      shortcut: '/',
      category: 'Navigation',
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      action: theme.toggleTheme,
      icon: theme.darkMode ? <Sun size={18} /> : <Moon size={18} />,
      shortcut: 'Ctrl+T',
      category: 'Settings',
    },
    {
      id: 'open-chat',
      label: 'Open AI Chat',
      description: 'Chat with AI assistant',
      action: () => chat.setIsChatOpen(true),
      icon: <Zap size={18} />,
      shortcut: 'Ctrl+K',
      category: 'AI',
    },
  ];

  const filteredNotes = React.useMemo(() => {
    let result = notes.notes;

    // First, apply trash filter
    if (selectedGroup === FILTER_TRASH) {
      // Show only deleted notes in trash view
      result = result.filter(note => note.deletedAt);
    } else {
      // Exclude deleted notes from all other views
      result = result.filter(note => !note.deletedAt);

      // Apply group filter (folder or tag-based) only for non-trash views
      if (selectedGroup !== null) {
        if (selectedGroup.startsWith('folder:')) {
          // Filter by folder
          const folderId = selectedGroup.substring(7);
          result = result.filter(note => note.folderId === folderId);
        } else if (selectedGroup === FILTER_UNTAGGED) {
          result = result.filter(note => !note.tags || note.tags.length === 0);
        } else {
          // Filter by tag
          result = result.filter(note => note.tags?.includes(selectedGroup));
        }
      }
    }

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

    // Sort: pinned notes first, then by creation date
    result.sort((a, b) => {
      // Pinned notes come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by creation date (newest first)
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

    return result;
  }, [notes.notes, searchQuery, selectedFilters, selectedGroup]);

  const handleNoteClick = (note: Note) => {
    notes.setActiveNote(note);
    onNavigateToEditor(note, 'editor', 'notes', false);
  };

  const handleToggleSelect = (noteId: string) => {
    setSelectedNoteIds(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map(note => note.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedNoteIds.length} note(s)?`)) {
      selectedNoteIds.forEach(noteId => notes.deleteNote(noteId));
      setSelectedNoteIds([]);
    }
  };

  const handleBulkMoveToFolder = (folderId: string | null) => {
    selectedNoteIds.forEach(noteId => {
      notes.updateNote(noteId, { folderId: folderId === 'none' ? undefined : folderId });
    });
    setSelectedNoteIds([]);
    setShowMoveToFolder(false);
  };

  const handleBulkExport = () => {
    const selectedNotes = notes.notes.filter(note => selectedNoteIds.includes(note.id));
    const exportData = selectedNotes.map(note => ({
      title: note.title,
      content: note.summaryText || note.verbatimText || note.userNotes || '',
      tags: note.tags,
      createdAt: new Date(note.createdAt).toISOString(),
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSelectedNoteIds([]);
  };

  const isSelectionMode = selectedNoteIds.length > 0;

  const pinnedNotes = React.useMemo(() => {
    return filteredNotes.filter(note => note.isPinned);
  }, [filteredNotes]);

  const unpinnedNotes = React.useMemo(() => {
    return filteredNotes.filter(note => !note.isPinned);
  }, [filteredNotes]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <SideMenu selectedGroup={selectedGroup} onGroupSelect={setSelectedGroup} />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pb-24">
          <header className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 py-3 mb-4 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile hamburger menu */}
                <div className="lg:hidden">
                  <SideMenu selectedGroup={selectedGroup} onGroupSelect={setSelectedGroup} />
                </div>
                <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {APP_CONFIG.APP_NAME}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {selectedGroup && selectedGroup !== FILTER_UNTAGGED ? (
                  <span className="flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {selectedGroup}
                    </span>
                    <span className="text-slate-400">({filteredNotes.length})</span>
                  </span>
                ) : selectedGroup === FILTER_UNTAGGED ? (
                  <span>Untagged ({filteredNotes.length})</span>
                ) : selectedGroup === FILTER_TRASH ? (
                  <span>Trash ({filteredNotes.length})</span>
                ) : (
                  <>{notes.notes.filter(n => !n.deletedAt).length} notes {searchQuery && `- ${filteredNotes.length} found`}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {selectedGroup !== FILTER_TRASH && filteredNotes.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={selectedNoteIds.length === filteredNotes.length ? "Deselect all" : "Select all"}
                aria-label={selectedNoteIds.length === filteredNotes.length ? "Deselect all" : "Select all"}
              >
                {selectedNoteIds.length === filteredNotes.length ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
            )}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Keyboard shortcuts"
              aria-label="Show keyboard shortcuts"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={theme.toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label={ARIA_LABELS.TOGGLE_THEME}
            >
              {theme.darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            aria-label={ARIA_LABELS.SEARCH_NOTES}
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        {notes.notes.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <SearchFilters
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
            />
            <NoteStats notes={notes.notes} filteredCount={filteredNotes.length} />
          </div>
        )}

        {filteredNotes.length === 0 ? (
          notes.notes.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="mx-auto w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                <FileText size={28} />
              </div>
              <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-1">
                Start taking notes
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                Capture ideas with text, voice recordings, or images
              </p>
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Edit3 size={18} />
                  </div>
                  <span className="text-xs text-slate-500">Write</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <Mic size={18} />
                  </div>
                  <span className="text-xs text-slate-500">Record</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                    <Image size={18} />
                  </div>
                  <span className="text-xs text-slate-500">Upload</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Cpu size={18} />
                  </div>
                  <span className="text-xs text-slate-500">AI</span>
                </div>
              </div>
              <button
                onClick={onCreateNote}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create Note
              </button>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm">No notes match your search</p>
            </div>
          )
        ) : selectedGroup === FILTER_TRASH ? (
          filteredNotes.map((note) => (
            <TrashNoteCard
              key={note.id}
              note={note}
              onClick={handleNoteClick}
              onRestore={notes.restoreNote}
              onPermanentDelete={notes.permanentlyDeleteNote}
            />
          ))
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 pt-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pinned</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={handleNoteClick}
                    onDelete={notes.deleteNote}
                    onTogglePin={notes.togglePin}
                    isSelected={selectedNoteIds.includes(note.id)}
                    onToggleSelect={handleToggleSelect}
                    isSelectionMode={isSelectionMode}
                  />
                ))}
              </>
            )}
            {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 px-1 pt-2">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>
            )}
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={handleNoteClick}
                onDelete={notes.deleteNote}
                onTogglePin={notes.togglePin}
                isSelected={selectedNoteIds.includes(note.id)}
                onToggleSelect={handleToggleSelect}
                isSelectionMode={isSelectionMode}
              />
            ))}
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-2xl px-4 py-3 z-30 flex items-center gap-3 border border-slate-700">
          <span className="text-sm font-medium">{selectedNoteIds.length} selected</span>
          <div className="h-5 w-px bg-slate-700" />
          <button
            onClick={() => setShowMoveToFolder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
            title="Move to folder"
          >
            <FolderInput size={16} />
            <span>Move</span>
          </button>
          <button
            onClick={handleBulkExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
            title="Export as JSON"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="Delete selected"
          >
            <Trash size={16} />
            <span>Delete</span>
          </button>
          <button
            onClick={() => setSelectedNoteIds([])}
            className="ml-2 p-1.5 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className={`fixed bottom-5 right-5 flex items-center gap-2 z-20 transition-transform ${isSelectionMode ? 'translate-y-20' : ''}`}>
        <button
          onClick={() => chat.setIsChatOpen(true)}
          className="w-11 h-11 bg-slate-800 dark:bg-slate-700 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 transition-all"
          aria-label="Open AI chat"
          title="AI Assistant"
        >
          <Zap size={18} />
        </button>
        <button
          onClick={onCreateNote}
          className="w-11 h-11 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
          aria-label={ARIA_LABELS.NEW_NOTE}
          title="New note"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
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

      {/* Move to Folder Modal */}
      <Modal
        isOpen={showMoveToFolder}
        onClose={() => setShowMoveToFolder(false)}
        title="Move to Folder"
        size="sm"
      >
        <div className="space-y-2">
          <button
            onClick={() => handleBulkMoveToFolder('none')}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            None (Remove from folder)
          </button>
          {folders.folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => handleBulkMoveToFolder(folder.id)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {folder.name}
            </button>
          ))}
          {folders.folders.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 px-3 py-4 text-center">
              No folders created yet
            </p>
          )}
        </div>
      </Modal>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
