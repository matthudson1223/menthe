// Storage Keys
export const STORAGE_KEYS = {
  NOTES: 'notes',
  FOLDERS: 'folders',
  THEME: 'theme',
  SETTINGS: 'settings',
  STORAGE_VERSION: 'storage_version',
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Menthe',
  AUTO_TITLE_DELAY: 2000, // ms
  AUTO_SAVE_DEBOUNCE: 1000, // ms
  PDF_GENERATION_OPTIONS: {
    margin: 10,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  },
  STORAGE_VERSION: 1,
} as const;

// Default Values
export const DEFAULTS = {
  NOTE_TITLE: 'New Note',
  UNTITLED_NOTE: 'Untitled Note',
  MAX_SWIPE_OFFSET: -80,
  SWIPE_THRESHOLD: -40,
  SWIPE_MOVEMENT_THRESHOLD: 5,
} as const;

// UI Messages
export const MESSAGES = {
  CONFIRM_DELETE: 'Are you sure you want to delete this note?',
  CONFIRM_SAVE_DRIVE: (title: string) => `Are you sure you want to save "${title}" to Google Drive?`,
  NO_CONTENT_TO_SUMMARIZE: 'Please add some notes or record audio to summarize.',
  PDF_GENERATION_FAILED: 'Failed to generate PDF. Please try again.',
  CLIPBOARD_SUCCESS: 'Note content copied to clipboard!',
  MICROPHONE_ACCESS_DENIED: 'Could not access microphone. Please check permissions.',
  PROCESSING_ERROR: 'An error occurred while processing your note. Please try again.',
  SUMMARY_GENERATION_FAILED: 'Failed to generate summary',
  CHAT_ERROR: 'Sorry, I encountered an error.',
} as const;

// API Retry Configuration
export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  RETRY_MULTIPLIER: 2,
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_NOTE: 'n',
  SEARCH: '/',
  TOGGLE_THEME: 't',
  SAVE: 's',
  ESCAPE: 'Escape',
} as const;

// Tab Types
export const TABS = {
  NOTES: 'notes',
  FILES: 'files',
  TRANSCRIPT: 'transcript',
  SUMMARY: 'summary',
} as const;

export type TabType = typeof TABS[keyof typeof TABS];

// Accessibility Labels
export const ARIA_LABELS = {
  NEW_NOTE: 'Create new note',
  DELETE_NOTE: 'Delete note',
  TOGGLE_THEME: 'Toggle dark mode',
  SEARCH_NOTES: 'Search notes',
  CLOSE_CHAT: 'Close chat',
  SEND_MESSAGE: 'Send message',
  START_RECORDING: 'Start recording',
  STOP_RECORDING: 'Stop recording',
  UPLOAD_IMAGE: 'Upload image',
  DOWNLOAD: 'Download note',
  SHARE: 'Share note',
  BACK_TO_DASHBOARD: 'Back to dashboard',
} as const;

// Animation Durations
export const ANIMATION = {
  TRANSITION_DURATION: 200, // ms
  TOAST_DURATION: 2000, // ms
  DEBOUNCE_DELAY: 300, // ms
} as const;

// Filter Constants
export const FILTER_UNTAGGED = '__untagged__';
export const FILTER_TRASH = '__trash__';

// Default Settings
export const DEFAULT_SETTINGS = {
  themeMode: 'system' as const,
  exportDefaults: {
    includeTags: true,
    includeSummary: true,
    pdfFormat: 'a4' as const,
  },
} as const;
