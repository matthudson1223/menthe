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
  tags: string[]; // User-defined tags for organization
  createdAt: number;
  updatedAt?: number; // Last modification timestamp for sync conflict resolution
  isProcessing: boolean;
  driveFileId?: string; // Google Drive file ID for saved files
  deletedAt?: number; // Soft delete timestamp - when note was moved to trash
  isPinned?: boolean; // Pin note to top of list
  folderId?: string; // Folder assignment for organization
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
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
export type ViewType = 'dashboard' | 'editor' | 'settings';
export type TabType = 'notes' | 'files' | 'transcript' | 'summary';
export type SaveStatus = 'idle' | 'saving' | 'success';

// Settings Types
export type ThemeMode = 'system' | 'light' | 'dark';
export type PdfFormat = 'a4' | 'letter';

export interface ExportDefaults {
  includeTags: boolean;
  includeSummary: boolean;
  pdfFormat: PdfFormat;
}

export interface AppSettings {
  themeMode: ThemeMode;
  exportDefaults: ExportDefaults;
  apiKey?: string; // For self-hosted/custom API usage
}

export type SettingsTabType = 'general' | 'appearance' | 'export' | 'account';

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
  onTogglePin?: (noteId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (noteId: string) => void;
  isSelectionMode?: boolean;
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
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  togglePin: (noteId: string) => void;
  syncWithDrive?: (accessToken: string) => Promise<void>;
}

export interface UseFoldersReturn {
  folders: Folder[];
  createFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
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
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
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
