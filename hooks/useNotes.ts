import { useState, useEffect, useCallback } from 'react';
import { Note, NoteType, UseNotesReturn } from '../types';
import { storageService } from '../services/storageService';
import { DEFAULTS } from '../constants';

/**
 * Custom hook for managing notes
 */
export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Load notes from storage on mount
  useEffect(() => {
    const loadedNotes = storageService.getNotes();
    // Reset processing state on load to prevent stuck states
    const processedNotes = loadedNotes.map(note => ({
      ...note,
      isProcessing: false,
    }));
    setNotes(processedNotes);
  }, []);

  // Save notes to storage whenever they change
  useEffect(() => {
    if (notes.length > 0 || storageService.getNotes().length > 0) {
      storageService.saveNotes(notes);
    }
  }, [notes]);

  const createNote = useCallback((
    type: NoteType,
    initialData?: { url?: string; text?: string }
  ): Note => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: DEFAULTS.NOTE_TITLE,
      type,
      originalMediaUrl: initialData?.url,
      mediaItems: initialData?.url
        ? [{
            id: crypto.randomUUID(),
            type: type === 'audio' ? 'audio' : 'image',
            url: initialData.url,
            createdAt: Date.now(),
          }]
        : [],
      verbatimText: '',
      userNotes: initialData?.text || '',
      summaryText: '',
      createdAt: Date.now(),
      isProcessing: false,
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, ...updates } : note
    ));

    setActiveNote(prev =>
      prev?.id === id ? { ...prev, ...updates } : prev
    );
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));

    setActiveNote(prev => {
      if (prev?.id === noteId) {
        return null;
      }
      return prev;
    });
  }, []);

  return {
    notes,
    activeNote,
    setActiveNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
