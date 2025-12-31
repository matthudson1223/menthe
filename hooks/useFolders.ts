import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Folder, UseFoldersReturn } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): T => {
  const cleaned = {} as T;
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  });
  return cleaned;
};

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const { user } = useAuth();
  const pendingWrites = useRef<Map<string, Promise<void>>>(new Map());

  const enqueueWrite = useCallback(
    (folderId: string, operation: () => Promise<void>, onError: (error: unknown) => void) => {
      const previous = pendingWrites.current.get(folderId) ?? Promise.resolve();

      const next = previous
        .catch(() => {
          // Swallow previous errors so future writes still run
        })
        .then(operation)
        .catch(error => {
          onError(error);
        })
        .finally(() => {
          if (pendingWrites.current.get(folderId) === next) {
            pendingWrites.current.delete(folderId);
          }
        });

      pendingWrites.current.set(folderId, next);
    },
    []
  );

  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }

    const foldersRef = collection(db, 'users', user.uid, 'folders');
    const unsubscribe = onSnapshot(
      foldersRef,
      snapshot => {
        const loadedFolders: Folder[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as Folder;
          return {
            ...data,
            id: data.id ?? docSnap.id,
          };
        });

        loadedFolders.sort((a, b) => a.createdAt - b.createdAt);
        setFolders(loadedFolders);
      },
      error => {
        console.error('Error loading folders from Firestore:', error);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  const createFolder = useCallback((name: string): Folder => {
    const uid = user?.uid;
    const now = Date.now();
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
    };

    const cleanedFolder = removeUndefinedFields(newFolder);

    setFolders(prev => [...prev, cleanedFolder]);

    if (uid) {
      const folderRef = doc(collection(db, 'users', uid, 'folders'), cleanedFolder.id);
      enqueueWrite(cleanedFolder.id, () => setDoc(folderRef, cleanedFolder), error => {
        console.error('Error creating folder in Firestore:', error);
      });
    } else {
      console.warn('Cannot persist folder to Firestore: no authenticated user');
    }

    return cleanedFolder;
  }, [user, db, enqueueWrite]);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));

    const uid = user?.uid;
    if (uid) {
      const folderRef = doc(db, 'users', uid, 'folders', id);
      enqueueWrite(id, () => deleteDoc(folderRef), error => {
        console.error('Error deleting folder from Firestore:', error);
      });
    } else {
      console.warn('Cannot delete folder from Firestore: no authenticated user');
    }
  }, [user, db, enqueueWrite]);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev => prev.map(folder =>
      folder.id === id ? { ...folder, name } : folder
    ));

    const uid = user?.uid;
    if (uid) {
      const folderRef = doc(db, 'users', uid, 'folders', id);
      enqueueWrite(id, () => updateDoc(folderRef, { name }), error => {
        console.error('Error renaming folder in Firestore:', error);
      });
    } else {
      console.warn('Cannot rename folder in Firestore: no authenticated user');
    }
  }, [user, db, enqueueWrite]);

  return {
    folders,
    createFolder,
    deleteFolder,
    renameFolder,
  };
}
