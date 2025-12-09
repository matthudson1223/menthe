import React, { createContext, useContext, ReactNode } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useNoteProcessing } from '../hooks/useNoteProcessing';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';
import { useRecording } from '../hooks/useRecording';
import type {
  UseNotesReturn,
  UseNoteProcessingReturn,
  UseChatReturn,
  UseThemeReturn,
  UseRecordingReturn,
} from '../types';

interface NotesContextValue {
  notes: UseNotesReturn;
  processing: UseNoteProcessingReturn;
  chat: UseChatReturn;
  theme: UseThemeReturn;
  recording: UseRecordingReturn;
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const notes = useNotes();
  const processing = useNoteProcessing(notes.updateNote);
  const chat = useChat();
  const theme = useTheme();
  const recording = useRecording();

  const value: NotesContextValue = {
    notes,
    processing,
    chat,
    theme,
    recording,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
}
