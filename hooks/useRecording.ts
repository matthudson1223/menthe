import { useState, useCallback, useRef } from 'react';
import { UseRecordingReturn } from '../types';
import { MESSAGES } from '../constants';

/**
 * Custom hook for managing audio recording
 */
export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onStopCallbackRef = useRef<((dataUrl: string, base64: string) => void) | null>(null);

  const startRecording = useCallback(async (
    onStop: (dataUrl: string, base64: string) => void
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      onStopCallbackRef.current = onStop;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.split(',')[1];

          if (onStopCallbackRef.current) {
            onStopCallbackRef.current(dataUrl, base64Data);
          }
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

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
