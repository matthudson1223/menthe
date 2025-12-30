import { useState, useCallback, useRef } from 'react';
import { UseRecordingReturn } from '../types';
import { MESSAGES } from '../constants';

/**
 * Custom hook for managing audio recording
 */
export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const onStopCallbackRef = useRef<((dataUrl: string, base64: string) => void) | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);

  const startRecording = useCallback(async (
    onStop: (dataUrl: string, base64: string) => void
  ) => {
    // Wait for any previous recording to fully stop before starting a new one
    if (stopPromiseRef.current) {
      await stopPromiseRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      // Create a new chunks array for this recording session
      const chunks: Blob[] = [];
      onStopCallbackRef.current = onStop;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // Create a promise that resolves when the recording fully stops
      stopPromiseRef.current = new Promise<void>((resolve) => {
        recorder.onstop = async () => {
          try {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const reader = new FileReader();

            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              const base64Data = dataUrl.split(',')[1];

              if (onStopCallbackRef.current) {
                onStopCallbackRef.current(dataUrl, base64Data);
              }
              resolve();
            };

            reader.onerror = () => {
              console.error('Error reading audio blob');
              resolve();
            };

            reader.readAsDataURL(audioBlob);
          } finally {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      });

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw new Error(MESSAGES.MICROPHONE_ACCESS_DENIED);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
    }
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}
