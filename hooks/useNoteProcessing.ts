import { useState, useCallback } from 'react';
import { Note, ProcessingStatus, UseNoteProcessingReturn } from '../types';
import * as geminiService from '../services/geminiService';
import { MESSAGES } from '../constants';
import { isDefaultTitle, retryWithBackoff } from '../utils/helpers';

/**
 * Custom hook for AI note processing operations
 */
export function useNoteProcessing(
  updateNote: (id: string, updates: Partial<Note>) => void
): UseNoteProcessingReturn {
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    step: 'idle',
    message: '',
  });

  const processNote = useCallback(async (
    note: Note,
    base64Data: string,
    mimeType: string,
    type: 'image' | 'audio',
    initialTranscript?: string
  ) => {
    updateNote(note.id, { isProcessing: true });

    try {
      // 1. Transcribe (if not already transcribed)
      let verbatim = initialTranscript || '';

      if (!verbatim) {
        setProcessingStatus({ step: 'transcribing', message: 'Transcribing content...' });

        const transcribeFn = type === 'image'
          ? () => geminiService.transcribeImage(base64Data, mimeType)
          : () => geminiService.transcribeAudio(base64Data, mimeType);

        verbatim = await retryWithBackoff(transcribeFn);
      }

      updateNote(note.id, { verbatimText: verbatim });

      // 2. Summarize
      setProcessingStatus({ step: 'summarizing', message: 'Generating summary...' });
      const summary = await retryWithBackoff(() =>
        geminiService.generateSummary(verbatim, note.userNotes)
      );
      updateNote(note.id, { summaryText: summary });

      // 3. Generate title
      setProcessingStatus({ step: 'titling', message: 'Creating title...' });
      const title = await retryWithBackoff(() =>
        geminiService.generateTitle(verbatim.substring(0, 1000))
      );
      updateNote(note.id, { title });

      setProcessingStatus({ step: 'idle', message: '' });
    } catch (error) {
      console.error('Processing failed:', error);
      setProcessingStatus({ step: 'idle', message: '' });
      throw new Error(MESSAGES.PROCESSING_ERROR);
    } finally {
      updateNote(note.id, { isProcessing: false });
    }
  }, [updateNote]);

  const generateSummary = useCallback(async (note: Note) => {
    if (!note.verbatimText && !note.userNotes) {
      throw new Error(MESSAGES.NO_CONTENT_TO_SUMMARIZE);
    }

    updateNote(note.id, { isProcessing: true });

    try {
      const promises: Promise<string>[] = [
        retryWithBackoff(() =>
          geminiService.generateSummary(note.verbatimText, note.userNotes)
        )
      ];

      const contentForTitle = (note.userNotes || '') + '\n' + (note.verbatimText || '');
      const shouldGenerateTitle = isDefaultTitle(note.title) && contentForTitle;

      if (shouldGenerateTitle) {
        promises.push(
          retryWithBackoff(() =>
            geminiService.generateTitle(contentForTitle.substring(0, 1000))
          )
        );
      }

      const results = await Promise.all(promises);
      const summary = results[0];
      const title = results[1];

      const updates: Partial<Note> = {
        summaryText: summary,
        isProcessing: false
      };

      if (title) {
        updates.title = title;
      }

      updateNote(note.id, updates);
    } catch (error) {
      console.error('Summary generation failed:', error);
      updateNote(note.id, { isProcessing: false });
      throw new Error(MESSAGES.SUMMARY_GENERATION_FAILED);
    }
  }, [updateNote]);

  const refineSummary = useCallback(async (note: Note, instruction: string) => {
    try {
      const refined = await retryWithBackoff(() =>
        geminiService.refineSummary(note.summaryText, instruction)
      );
      updateNote(note.id, { summaryText: refined });
    } catch (error) {
      console.error('Refinement failed:', error);
      throw error;
    }
  }, [updateNote]);

  const generateTitle = useCallback(async (note: Note, content: string) => {
    try {
      const title = await retryWithBackoff(() =>
        geminiService.generateTitle(content)
      );
      updateNote(note.id, { title });
    } catch (error) {
      console.error('Title generation failed:', error);
      // Don't throw, just log - title generation is not critical
    }
  }, [updateNote]);

  return {
    processingStatus,
    processNote,
    generateSummary,
    refineSummary,
    generateTitle,
  };
}
