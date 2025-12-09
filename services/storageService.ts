import { Note } from '../types';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';

/**
 * Storage Service
 * Handles all localStorage operations with error handling and migrations
 */
class StorageService {
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    if (this.storageAvailable) {
      this.runMigrations();
    }
  }

  /**
   * Check if localStorage is available
   */
  private checkStorageAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  /**
   * Run migrations if needed
   */
  private runMigrations(): void {
    try {
      const currentVersion = this.getItem<number>(STORAGE_KEYS.STORAGE_VERSION) || 0;

      if (currentVersion < APP_CONFIG.STORAGE_VERSION) {
        // Run migrations here
        this.migrateV0ToV1();
        this.setItem(STORAGE_KEYS.STORAGE_VERSION, APP_CONFIG.STORAGE_VERSION);
      }
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }

  /**
   * Migrate from version 0 to version 1
   */
  private migrateV0ToV1(): void {
    try {
      const notes = this.getNotes();
      // Reset processing state for all notes (in case they were stuck)
      const migratedNotes = notes.map(note => ({
        ...note,
        isProcessing: false,
      }));
      this.saveNotes(migratedNotes);
    } catch (e) {
      console.error('V0 to V1 migration failed:', e);
    }
  }

  /**
   * Generic get item from storage
   */
  private getItem<T>(key: string): T | null {
    if (!this.storageAvailable) return null;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error getting item ${key} from storage:`, e);
      return null;
    }
  }

  /**
   * Generic set item to storage
   */
  private setItem<T>(key: string, value: T): boolean {
    if (!this.storageAvailable) return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        // TODO: Implement cleanup strategy
      } else {
        console.error(`Error setting item ${key} to storage:`, e);
      }
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  private removeItem(key: string): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing item ${key} from storage:`, e);
    }
  }

  /**
   * Get all notes from storage
   */
  getNotes(): Note[] {
    const notes = this.getItem<Note[]>(STORAGE_KEYS.NOTES);
    return notes || [];
  }

  /**
   * Save notes to storage
   */
  saveNotes(notes: Note[]): boolean {
    return this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  /**
   * Get theme from storage
   */
  getTheme(): 'light' | 'dark' | null {
    return this.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME);
  }

  /**
   * Save theme to storage
   */
  saveTheme(theme: 'light' | 'dark'): boolean {
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get system theme preference
   */
  getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Clear all storage (useful for debugging or reset)
   */
  clearAll(): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = {
      notes: this.getNotes(),
      theme: this.getTheme(),
      exportedAt: new Date().toISOString(),
      version: APP_CONFIG.STORAGE_VERSION,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);

      if (data.notes && Array.isArray(data.notes)) {
        this.saveNotes(data.notes);
      }

      if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
        this.saveTheme(data.theme);
      }

      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: boolean } {
    if (!this.storageAvailable) {
      return { used: 0, available: false };
    }

    try {
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      return { used, available: true };
    } catch (e) {
      return { used: 0, available: false };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
