import { useState, useCallback } from 'react';
import { Note, ProcessingStatus, UseNoteProcessingReturn } from '../types';
import * as geminiService from '../services/geminiService';
import { MESSAGES } from '../constants';
import { isDefaultTitle, retryWithBackoff } from '../utils/helpers';

const buildCombinedTranscript = (note: Note): string => {
  const audioPart = note.audioTranscript || note.verbatimText || '';
  const imagePart = note.imageTranscript || '';

  return [audioPart, imagePart].filter(Boolean).join('\n\n---\n\n');
};

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
      // Transcribe only (no summary/title here)
      let audioTranscript = type === 'audio' ? (initialTranscript || '') : '';
      let imageTranscript = '';

      if (type === 'audio' && !audioTranscript) {
        setProcessingStatus({ step: 'transcribing', message: 'Transcribing content...' });
        audioTranscript = await retryWithBackoff(() =>
          geminiService.transcribeAudio(base64Data, mimeType)
        );
      }

      if (type === 'image') {
        setProcessingStatus({ step: 'transcribing', message: 'Transcribing content...' });
        imageTranscript = await retryWithBackoff(() =>
          geminiService.transcribeImage(base64Data, mimeType)
        );
      }

      setProcessingStatus({ step: 'idle', message: '' });

      if (type === 'audio') {
        const existingAudio = note.audioTranscript || note.verbatimText || '';
        const combinedAudio = existingAudio
          ? `${existingAudio}\n\n---\n\n${audioTranscript}`
          : audioTranscript;

        updateNote(note.id, {
          verbatimText: combinedAudio,
          audioTranscript: combinedAudio,
        });
      } else if (type === 'image') {
        const existingImage = note.imageTranscript || '';
        const combinedImage = existingImage
          ? `${existingImage}\n\n---\n\n${imageTranscript}`
          : imageTranscript;

        updateNote(note.id, {
          imageTranscript: combinedImage,
        });
      }
    } catch (error) {
      console.error('Processing failed:', error);
      setProcessingStatus({ step: 'idle', message: '' });
      throw new Error(MESSAGES.PROCESSING_ERROR);
    } finally {
      updateNote(note.id, { isProcessing: false });
    }
  }, [updateNote]);

  const generateSummary = useCallback(async (note: Note) => {
    const hasTranscriptContent =
      !!note.verbatimText || !!note.audioTranscript || !!note.imageTranscript;

    if (!hasTranscriptContent && !note.userNotes) {
      throw new Error(MESSAGES.NO_CONTENT_TO_SUMMARIZE);
    }

    updateNote(note.id, { isProcessing: true });

    try {
      const combinedTranscript = buildCombinedTranscript(note);

      const promises: Promise<any>[] = [
        retryWithBackoff(() =>
          geminiService.generateSummary(combinedTranscript, note.userNotes)
        )
      ];

      const contentForTitle =
        (note.userNotes || '') + '\n' + (combinedTranscript || '');
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

      // Generate tags from the summary
      setProcessingStatus({ step: 'titling', message: 'Generating tags...' });
      const tags = await retryWithBackoff(() =>
        geminiService.generateTags(summary, title || note.title)
      );

      const updates: Partial<Note> = {
        summaryText: summary,
        tags: tags.length > 0 ? tags : note.tags || [],
        isProcessing: false
      };

      if (title) {
        updates.title = title;
      }

      setProcessingStatus({ step: 'idle', message: '' });
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
