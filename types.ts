// Note Types
export type NoteType = 'image' | 'audio' | 'text';

export interface MediaItem {
  id: string;
  type: 'image' | 'audio';
  url: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  originalMediaUrl?: string; // base64 data url for display/playback
  mediaItems?: MediaItem[];
  verbatimText: string; // primary transcript shown in Transcript tab (audio-focused)
  audioTranscript?: string; // full audio transcript (kept in sync with verbatimText)
  imageTranscript?: string; // image-derived text, stored for summarization
  userNotes?: string; // Manual user notes separate from transcript
  summaryText: string;
  createdAt: number;
  isProcessing: boolean;
  driveFileId?: string; // Google Drive file ID for saved files
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  FLASH_LITE = 'gemini-flash-lite-latest',
  PRO = 'gemini-3-pro-preview',
}

export type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'refining' | 'titling';

export interface ProcessingStatus {
  step: ProcessingStep;
  message: string;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// View Types
export type ViewType = 'dashboard' | 'editor';
export type TabType = 'notes' | 'files' | 'transcript' | 'summary';
export type SaveStatus = 'idle' | 'saving' | 'success';

// Storage Types
export interface StorageData {
  notes: Note[];
  theme: 'light' | 'dark';
  version: number;
}

// Component Props
export interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export interface ProcessingOverlayProps {
  status: ProcessingStatus;
}

// Hook Return Types
export interface UseNotesReturn {
  notes: Note[];
  activeNote: Note | null;
  setActiveNote: (note: Note | null) => void;
  createNote: (type: NoteType, initialData?: { url?: string; text?: string }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
}

export interface UseNoteProcessingReturn {
  processingStatus: ProcessingStatus;
  processNote: (
    note: Note,
    base64Data: string,
    mimeType: string,
    type: 'image' | 'audio',
    initialTranscript?: string
  ) => Promise<void>;
  generateSummary: (note: Note) => Promise<void>;
  refineSummary: (note: Note, instruction: string) => Promise<void>;
  generateTitle: (note: Note, content: string) => Promise<void>;
}

export interface UseChatReturn {
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  setIsChatOpen: (open: boolean) => void;
  setChatInput: (input: string) => void;
  sendMessage: () => Promise<void>;
  clearChat: () => void;
}

export interface UseThemeReturn {
  darkMode: boolean;
  toggleTheme: () => void;
}

export interface UseRecordingReturn {
  isRecording: boolean;
  startRecording: (onStop: (dataUrl: string, base64: string) => void) => Promise<void>;
  stopRecording: () => void;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  retry?: () => void;
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: AppError;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
