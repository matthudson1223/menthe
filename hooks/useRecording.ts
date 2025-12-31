import { useState, useCallback, useRef, useEffect } from 'react';
import { UseRecordingReturn } from '../types';
import { MESSAGES } from '../constants';

/**
 * Custom hook for managing audio recording
 * Updated with Screen Wake Lock API to prevent phone locking
 */
export function useRecording(): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const onStopCallbackRef = useRef<((dataUrl: string, base64: string) => void) | null>(null);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  
  // NEW: Ref to hold the wake lock
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // NEW: Helper to request the screen wake lock
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Screen Wake Lock acquired');
      } catch (err) {
        console.error('Could not acquire Wake Lock:', err);
      }
    }
  }, []);

  // NEW: Helper to release the screen wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen Wake Lock released');
      } catch (err) {
        console.error('Error releasing Wake Lock:', err);
      }
    }
  }, []);

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
      
      // NEW: Request Wake Lock when recording starts
      await requestWakeLock();
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw new Error(MESSAGES.MICROPHONE_ACCESS_DENIED);
    }
  }, [requestWakeLock]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current = null;
      
      // NEW: Release Wake Lock when recording stops
      await releaseWakeLock();
    }
  }, [isRecording, releaseWakeLock]);

  // NEW: Re-acquire lock if visibility changes (e.g. user tabs back in)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRecording) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording, requestWakeLock]);

  // NEW: Cleanup lock on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}