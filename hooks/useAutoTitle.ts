import { useEffect, useRef } from 'react';
import { Note } from '../types';
import { APP_CONFIG } from '../constants';
import { isDefaultTitle } from '../utils/helpers';

/**
 * Custom hook for auto-generating titles with debouncing
 */
export function useAutoTitle(
  note: Note | null,
  onGenerateTitle: (note: Note, content: string) => Promise<void>
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!note) return;

    const content = note.userNotes || note.verbatimText || '';
    if (!content) return;

    // Only auto-title if it looks like a default title
    if (isDefaultTitle(note.title) && content.length > 50) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          await onGenerateTitle(note, content);
        } catch (e) {
          console.error('Auto-title failed', e);
        }
      }, APP_CONFIG.AUTO_TITLE_DELAY);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [note?.verbatimText, note?.userNotes, note?.id, onGenerateTitle]);
}
