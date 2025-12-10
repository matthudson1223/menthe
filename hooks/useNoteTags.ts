import { useCallback } from 'react';
import { Note } from '../types';

/**
 * Custom hook for managing note tags
 * Used with a Note object to provide tag operations
 */
export function useNoteTags(
  note: Note | null,
  updateNote: (id: string, updates: Partial<Note>) => void
) {
  const addTag = useCallback((tag: string) => {
    if (!note) return;
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return;

    const currentTags = note.tags || [];
    if (!currentTags.includes(normalizedTag)) {
      updateNote(note.id, { tags: [...currentTags, normalizedTag] });
    }
  }, [note, updateNote]);

  const removeTag = useCallback((tag: string) => {
    if (!note) return;
    updateNote(note.id, {
      tags: (note.tags || []).filter(t => t !== tag),
    });
  }, [note, updateNote]);

  const setTags = useCallback((tags: string[]) => {
    if (!note) return;
    const normalizedTags = tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 10); // Limit to 10 tags

    // Remove duplicates
    const uniqueTags = Array.from(new Set(normalizedTags));

    updateNote(note.id, { tags: uniqueTags });
  }, [note, updateNote]);

  const editTag = useCallback((oldTag: string, newTag: string) => {
    if (!note) return;
    const normalizedNewTag = newTag.trim().toLowerCase();
    if (!normalizedNewTag) return;

    const updatedTags = (note.tags || [])
      .map(tag => tag === oldTag ? normalizedNewTag : tag)
      .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates

    updateNote(note.id, { tags: updatedTags });
  }, [note, updateNote]);

  return { addTag, removeTag, setTags, editTag };
}
