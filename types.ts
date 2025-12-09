export interface Note {
  id: string;
  title: string;
  type: 'image' | 'audio' | 'text';
  originalMediaUrl?: string; // base64 data url for display/playback
  verbatimText: string;
  userNotes?: string; // Manual user notes separate from transcript
  summaryText: string;
  createdAt: number;
  isProcessing: boolean;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  FLASH_LITE = 'gemini-flash-lite-latest',
  PRO = 'gemini-3-pro-preview',
}

export interface ProcessingStatus {
  step: 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'refining' | 'titling';
  message: string;
}