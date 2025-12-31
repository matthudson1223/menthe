import React, { createContext, useContext, ReactNode } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useNoteProcessing } from '../hooks/useNoteProcessing';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';
import { useRecording } from '../hooks/useRecording';
import type {
  UseNotesReturn,
  UseFoldersReturn,
  UseNoteProcessingReturn,
  UseChatReturn,
  UseThemeReturn,
  UseRecordingReturn,
} from '../types';

interface NotesContextValue {
  notes: UseNotesReturn;
  folders: UseFoldersReturn;
  processing: UseNoteProcessingReturn;
  chat: UseChatReturn;
  theme: UseThemeReturn;
  recording: UseRecordingReturn;
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const notes = useNotes();
  const folders = useFolders();
  const processing = useNoteProcessing(notes.updateNote);
  const chat = useChat();
  const theme = useTheme();
  const recording = useRecording();

  const value: NotesContextValue = {
    notes,
    folders,
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
