import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Note, NoteType, UseNotesReturn } from '../types';
import { DEFAULTS } from '../constants';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { importNotesFromDrive } from '../services/driveService';

/**
 * Custom hook for managing notes
 */
const sanitizeUpdates = (updates: Partial<Note>): Partial<Note> => {
  const cleaned: Partial<Note> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key as keyof Note] = value;
    }
  });
  return cleaned;
};

const applyUpdates = (note: Note, updates: Partial<Note>): Note => {
  const updatedNote: Note = { ...note, ...updates };
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      delete (updatedNote as Record<string, unknown>)[key];
    }
  });
  return updatedNote;
};

const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): T => {
  const cleanValue = (value: unknown): unknown => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
      return value
        .map(item => (typeof item === 'object' && item !== null ? cleanValue(item) : item))
        .filter(item => item !== undefined);
    }
    if (value && typeof value === 'object') {
      return removeUndefinedFields(value as Record<string, unknown>);
    }
    return value;
  };

  const cleaned = {} as T;
  Object.entries(obj).forEach(([key, value]) => {
    const cleanedValue = cleanValue(value);
    if (cleanedValue !== undefined) {
      (cleaned as Record<string, unknown>)[key] = cleanedValue;
    }
  });
  return cleaned;
};

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const { user } = useAuth();
  const pendingWrites = useRef<Map<string, Promise<void>>>(new Map());
  const pendingLocalUpdates = useRef<Map<string, Set<string>>>(new Map());

  const enqueueWrite = useCallback(
    (noteId: string, operation: () => Promise<void>, onError: (error: unknown) => void) => {
      const previous = pendingWrites.current.get(noteId) ?? Promise.resolve();

      const next = previous
        .catch(() => {
          // Swallow previous errors so future writes still run
        })
        .then(operation)
        .catch(error => {
          onError(error);
        })
        .finally(() => {
          if (pendingWrites.current.get(noteId) === next) {
            pendingWrites.current.delete(noteId);
          }
        });

      pendingWrites.current.set(noteId, next);
    },
    []
  );

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
          const noteId = data.id ?? docSnap.id;

          // Check for pending local updates
          const pendingFields = pendingLocalUpdates.current.get(noteId);

          // If we have pending updates, merge carefully
          if (pendingFields && pendingFields.size > 0) {
            // Get current note to preserve local values for pending fields
            const currentNote = notes.find(n => n.id === noteId);
            if (currentNote) {
              // Keep local values for pending fields, use Firestore for others
              const mergedData: Note = { ...data, id: noteId, isProcessing: false };
              pendingFields.forEach(field => {
                const fieldKey = field as keyof Note;
                if (currentNote[fieldKey] !== undefined) {
                  (mergedData as any)[fieldKey] = currentNote[fieldKey];
                }
              });
              return mergedData;
            }
          }

          return {
            ...data,
            id: noteId,
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
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: DEFAULTS.NOTE_TITLE,
      type,
      ...(initialData?.url ? { originalMediaUrl: initialData.url } : {}),
      mediaItems: initialData?.url
        ? [{
            id: crypto.randomUUID(),
            type: type === 'audio' ? 'audio' : 'image',
            url: initialData.url,
            createdAt: now,
          }]
        : [],
      verbatimText: '',
      userNotes: initialData?.text || '',
      summaryText: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      isProcessing: false,
    };

    const cleanedNote = removeUndefinedFields(newNote);

    setNotes(prev => [cleanedNote, ...prev]);

    if (uid) {
      const noteRef = doc(collection(db, 'users', uid, 'notes'), cleanedNote.id);
      enqueueWrite(cleanedNote.id, () => setDoc(noteRef, cleanedNote), error => {
        console.error('Error creating note in Firestore:', error);
      });
    } else {
      console.warn('Cannot persist note to Firestore: no authenticated user');
    }

    return cleanedNote;
  }, [user, db, enqueueWrite]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    // Track which fields are being updated
    const updatedFields = new Set(Object.keys(updates));

    // Mark fields as pending local update
    const pending = pendingLocalUpdates.current.get(id) || new Set<string>();
    updatedFields.forEach(field => pending.add(field));
    pendingLocalUpdates.current.set(id, pending);

    // Add updatedAt timestamp to track modifications
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Date.now(),
    };

    // Optimistic local update
    setNotes(prev => prev.map(note =>
      note.id === id ? applyUpdates(note, updatesWithTimestamp) : note
    ));

    setActiveNote(prev =>
      prev?.id === id ? applyUpdates(prev, updatesWithTimestamp) : prev
    );

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', id);
      const cleanedUpdates = removeUndefinedFields(sanitizeUpdates(updatesWithTimestamp));

      const writePromise = updateDoc(noteRef, cleanedUpdates);

      enqueueWrite(
        id,
        () => writePromise,
        error => {
          console.error('Error updating note in Firestore:', error);
          // On error, clear pending fields so external updates can sync
          const pending = pendingLocalUpdates.current.get(id);
          if (pending) {
            updatedFields.forEach(field => pending.delete(field));
            if (pending.size === 0) {
              pendingLocalUpdates.current.delete(id);
            }
          }
        }
      );

      // Clear pending status after write completes
      writePromise
        .then(() => {
          const pending = pendingLocalUpdates.current.get(id);
          if (pending) {
            updatedFields.forEach(field => pending.delete(field));
            if (pending.size === 0) {
              pendingLocalUpdates.current.delete(id);
            }
          }
        })
        .catch(() => {
          // Error already handled above
        });
    } else {
      console.warn('Cannot update note in Firestore: no authenticated user');
      // Clear pending since we're not actually writing
      const pending = pendingLocalUpdates.current.get(id);
      if (pending) {
        updatedFields.forEach(field => pending.delete(field));
        if (pending.size === 0) {
          pendingLocalUpdates.current.delete(id);
        }
      }
    }
  }, [user, db, enqueueWrite]);

  const deleteNote = useCallback((noteId: string) => {
    // Soft delete: set deletedAt timestamp instead of removing
    const deletedAtTimestamp = Date.now();

    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, deletedAt: deletedAtTimestamp, updatedAt: deletedAtTimestamp }
        : note
    ));

    setActiveNote(prev => {
      if (prev?.id === noteId) {
        return null;
      }
      return prev;
    });

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', noteId);
      enqueueWrite(noteId, () => updateDoc(noteRef, {
        deletedAt: deletedAtTimestamp,
        updatedAt: deletedAtTimestamp,
      }), error => {
        console.error('Error soft deleting note in Firestore:', error);
      });
    } else {
      console.warn('Cannot soft delete note in Firestore: no authenticated user');
    }
  }, [user, db, enqueueWrite]);

  const restoreNote = useCallback((noteId: string) => {
    // Restore note by clearing deletedAt timestamp
    const restoredAtTimestamp = Date.now();

    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const { deletedAt, ...noteWithoutDeletedAt } = note;
        return { ...noteWithoutDeletedAt, updatedAt: restoredAtTimestamp };
      }
      return note;
    }));

    setActiveNote(prev => {
      if (prev?.id === noteId) {
        const { deletedAt, ...noteWithoutDeletedAt } = prev;
        return { ...noteWithoutDeletedAt, updatedAt: restoredAtTimestamp };
      }
      return prev;
    });

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', noteId);
      enqueueWrite(noteId, async () => {
        // Use updateDoc to remove the deletedAt field
        await updateDoc(noteRef, {
          deletedAt: null,
          updatedAt: restoredAtTimestamp,
        });
      }, error => {
        console.error('Error restoring note in Firestore:', error);
      });
    } else {
      console.warn('Cannot restore note in Firestore: no authenticated user');
    }
  }, [user, db, enqueueWrite]);

  const permanentlyDeleteNote = useCallback((noteId: string) => {
    // Permanently delete: remove from Firestore
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
      enqueueWrite(noteId, () => deleteDoc(noteRef), error => {
        console.error('Error permanently deleting note from Firestore:', error);
      });
    } else {
      console.warn('Cannot permanently delete note from Firestore: no authenticated user');
    }
  }, [user, db, enqueueWrite]);

  const togglePin = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const newPinnedState = !note.isPinned;
    const updatedAtTimestamp = Date.now();

    setNotes(prev => prev.map(n =>
      n.id === noteId
        ? { ...n, isPinned: newPinnedState, updatedAt: updatedAtTimestamp }
        : n
    ));

    setActiveNote(prev =>
      prev?.id === noteId
        ? { ...prev, isPinned: newPinnedState, updatedAt: updatedAtTimestamp }
        : prev
    );

    const uid = user?.uid;
    if (uid) {
      const noteRef = doc(db, 'users', uid, 'notes', noteId);
      enqueueWrite(noteId, () => updateDoc(noteRef, {
        isPinned: newPinnedState,
        updatedAt: updatedAtTimestamp,
      }), error => {
        console.error('Error toggling pin in Firestore:', error);
      });
    } else {
      console.warn('Cannot toggle pin in Firestore: no authenticated user');
    }
  }, [notes, user, db, enqueueWrite]);

  const syncWithDrive = useCallback(async (accessToken: string) => {
    const uid = user?.uid;
    if (!uid) {
      throw new Error('Cannot sync with Drive: no authenticated user');
    }

    try {
      // Import notes from Drive
      const driveNotes = await importNotesFromDrive(accessToken);

      // Create a map of local notes by ID
      const localNotesMap = new Map<string, Note>();
      notes.forEach(note => {
        localNotesMap.set(note.id, note);
      });

      // Track notes to create or update
      const notesToSync: Note[] = [];

      // Process each Drive note
      for (const driveNote of driveNotes) {
        const localNote = localNotesMap.get(driveNote.id);

        if (!localNote) {
          // Note exists in Drive but not locally - create it
          notesToSync.push(driveNote);
        } else {
          // Note exists in both - apply "Last Modified Wins" conflict resolution
          const driveUpdatedAt = driveNote.updatedAt || driveNote.createdAt;
          const localUpdatedAt = localNote.updatedAt || localNote.createdAt;

          if (driveUpdatedAt > localUpdatedAt) {
            // Drive version is newer - update local
            notesToSync.push(driveNote);
          }
          // If local is newer or equal, keep local version (no action needed)
        }
      }

      // Sync notes to Firestore
      for (const note of notesToSync) {
        const noteRef = doc(db, 'users', uid, 'notes', note.id);
        const cleanedNote = removeUndefinedFields(note);

        // Use setDoc to create or overwrite
        await setDoc(noteRef, cleanedNote);
      }

      console.log(`Synced ${notesToSync.length} notes from Google Drive`);

      // Notes will be updated via the Firestore listener
    } catch (error) {
      console.error('Error syncing with Drive:', error);
      throw new Error('Failed to sync with Google Drive. Please try again.');
    }
  }, [user, db, notes]);

  return {
    notes,
    activeNote,
    setActiveNote,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    togglePin,
    syncWithDrive,
  };
}
