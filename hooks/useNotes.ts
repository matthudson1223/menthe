import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Note, NoteType, UseNotesReturn } from '../types';
import { DEFAULTS } from '../constants';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for managing notes
 */
export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setActiveNote(null);
      return;
    }

    const notesRef = collection(db, 'users', user.uid, 'notes');
    const unsubscribe = onSnapshot(
      notesRef,
      snapshot => {
        const loadedNotes: Note[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Note;
          return {
            ...data,
            id: data.id ?? docSnap.id,
            isProcessing: false,
          };
        });

        loadedNotes.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setNotes(loadedNotes);
      },
      error => {
        console.error('Error loading notes from Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  const createNote = useCallback((
    type: NoteType,
    initialData?: { url?: string; text?: string }
  ): Note => {
    const uid = user?.uid;
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
      tags: [],
      createdAt: Date.now(),
      isProcessing: false,
    };

    setNotes(prev => [newNote, ...prev]);

    if (uid) {
      const noteRef = doc(collection(db, 'users', uid, 'notes'), newNote.id);
      setDoc(noteRef, newNote).catch(error => {
        console.error('Error creating note in Firestore:', error);
      });
    } else {
      console.warn('Cannot persist note to Firestore: no authenticated user');
    }

    return newNote;
  }, [user, db]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, ...updates } : note
    ));

    setActiveNote(prev =>
      prev?.id === id ? { ...prev, ...updates } : prev
    );

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', id);
      updateDoc(noteRef, updates as Partial<Note>).catch(error => {
        console.error('Error updating note in Firestore:', error);
      });
    } else {
      console.warn('Cannot update note in Firestore: no authenticated user');
    }
  }, [user, db]);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));

    setActiveNote(prev => {
      if (prev?.id === noteId) {
        return null;
      }
      return prev;
    });

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', noteId);
      deleteDoc(noteRef).catch(error => {
        console.error('Error deleting note from Firestore:', error);
      });
    } else {
      console.warn('Cannot delete note from Firestore: no authenticated user');
    }
  }, [user, db]);

  return {
    notes,
    activeNote,
    setActiveNote,
    createNote,
    updateNote,
    deleteNote,
  };
}
