import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotesProvider, useNotesContext } from './context/NotesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider, useErrorHandler } from './hooks/useErrorHandler';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/editor';
import { ChatPanel } from './components/ChatPanel';
import { RecordingStatusBar } from './components/RecordingStatusBar';
import { AuthScreen } from './components/AuthScreen';
import { HelpTip } from './components/HelpTip';
import { useKeyboardShortcuts, useAutoTitle } from './hooks';
import { MESSAGES } from './constants';
import * as geminiService from './services/geminiService';
import type { ViewType, TabType, Note } from './types';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { notes, processing, recording, theme } = useNotesContext();
  const { showError } = useErrorHandler();
  const [view, setView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(() => {
    // Show hint only if user has no notes
    return true;
  });

  // Auto-title generation
  useAutoTitle(notes.activeNote, processing.generateTitle);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNote: handleCreateNote,
    onToggleTheme: theme.toggleTheme,
    onSave: () => {}, // Can be extended
  });

  function handleCreateNote() {
    const newNote = notes.createNote('text');
    notes.setActiveNote(newNote);
    setView('editor');
    setActiveTab('notes');
  }

  function handleNavigateToEditor(
    note: Note,
    targetView: ViewType,
    tab: TabType,
    editingSummary: boolean
  ) {
    notes.setActiveNote(note);
    setView(targetView);
    setActiveTab(tab);
  }

  function handleBackToDashboard() {
    setView('dashboard');
    notes.setActiveNote(null);
  }

  async function handleStartRecording() {
    try {
      // Ensure we have an active note
      let targetNote = notes.activeNote;
      if (!targetNote) {
        targetNote = notes.createNote('audio');
        notes.setActiveNote(targetNote);
        setView('editor');
      } else {
        notes.updateNote(targetNote.id, { type: 'audio' });
      }

      setActiveTab('transcript');

      await recording.startRecording(async (dataUrl, base64Data) => {
        const currentNote = notes.notes.find((n) => n.id === targetNote!.id);
        if (currentNote) {
          const existingItems = currentNote.mediaItems || [];
          const newItem = {
            id: crypto.randomUUID(),
            type: 'audio' as const,
            url: dataUrl,
            createdAt: Date.now(),
          };

          notes.updateNote(targetNote!.id, {
            originalMediaUrl: dataUrl,
            mediaItems: [...existingItems, newItem],
          });

          try {
            await processing.processNote(
              currentNote,
              base64Data,
              'audio/webm',
              'audio',
              ''
            );
          } catch (error) {
            showError(MESSAGES.PROCESSING_ERROR, {
              noteId: currentNote.id,
              mediaType: 'audio'
            }, error instanceof Error ? error.stack : undefined);
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message, {
          action: 'startRecording'
        }, error.stack);
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-600 dark:text-slate-300 text-sm">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <ProcessingOverlay status={processing.processingStatus} />

      {view === 'dashboard' ? (
        <Dashboard
          onNavigateToEditor={handleNavigateToEditor}
          onCreateNote={handleCreateNote}
        />
      ) : (
        <Editor
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={handleBackToDashboard}
          onStartRecording={handleStartRecording}
        />
      )}

      <ChatPanel />

      <RecordingStatusBar onStopRecording={recording.stopRecording} />

      {showFirstTimeHint && notes.notes.length === 0 && view === 'dashboard' && (
        <HelpTip
          message="Press ⌘N to create your first note, or press ⌘K for quick actions!"
          action={{ label: "Got it", onClick: () => setShowFirstTimeHint(false) }}
          autoClose={8000}
        />
      )}

      <button
        type="button"
        onClick={signOut}
        className="fixed bottom-4 right-4 rounded-full bg-slate-900 dark:bg-slate-100 text-slate-50 dark:text-slate-900 px-4 py-2 text-xs font-medium shadow-md hover:bg-slate-800 dark:hover:bg-slate-200"
      >
        Sign out
      </button>
    </div>
  );
}

export default function App() {
  // Vite injects client IDs prefixed with VITE_ during build.
  const googleClientId =
    import.meta.env?.VITE_GOOGLE_CLIENT_ID ??
    process.env.GOOGLE_CLIENT_ID ??
    '';

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <NotesProvider>
            <ErrorProvider>
              <AppContent />
            </ErrorProvider>
          </NotesProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
