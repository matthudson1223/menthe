import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotesProvider, useNotesContext } from './context/NotesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/editor';
import { ChatPanel } from './components/ChatPanel';
import { RecordingStatusBar } from './components/RecordingStatusBar';
import { useKeyboardShortcuts, useAutoTitle } from './hooks';
import { MESSAGES } from './constants';
import * as geminiService from './services/geminiService';
import type { ViewType, TabType, Note } from './types';

function AppContent() {
  const { notes, processing, recording } = useNotesContext();
  const [view, setView] = useState<ViewType>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('notes');

  // Auto-title generation
  useAutoTitle(notes.activeNote, processing.generateTitle);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNote: handleCreateNote,
    onToggleTheme: () => {}, // Handled by Dashboard/Editor components
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
            alert(MESSAGES.PROCESSING_ERROR);
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
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
    </div>
  );
}

export default function App() {
  // Get Google Client ID from environment variable
  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <NotesProvider>
          <AppContent />
        </NotesProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
