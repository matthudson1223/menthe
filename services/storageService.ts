import localforage from 'localforage';
import { Note, AppSettings } from '../types';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';

// Configure localforage to use IndexedDB
localforage.config({
  name: APP_CONFIG.APP_NAME,
  storeName: 'menthe_store',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

/**
 * Storage Service
 * Handles all IndexedDB operations via localforage with error handling and migrations
 */
class StorageService {
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.initialize();
  }

  /**
   * Initialize storage and run migrations
   */
  private async initialize(): Promise<void> {
    try {
      await this.runMigrations();
    } catch (e) {
      console.error('Storage initialization failed:', e);
    }
  }

  /**
   * Run migrations if needed
   */
  private async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getItem<number>(STORAGE_KEYS.STORAGE_VERSION) || 0;

      if (currentVersion < APP_CONFIG.STORAGE_VERSION) {
        await this.migrateV0ToV1();
        await this.setItem(STORAGE_KEYS.STORAGE_VERSION, APP_CONFIG.STORAGE_VERSION);
      }
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }

  /**
   * Migrate from version 0 to version 1
   */
  private async migrateV0ToV1(): Promise<void> {
    try {
      // Migrate data from localStorage to IndexedDB if present
      const oldNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (oldNotes) {
        const notes = JSON.parse(oldNotes) as Note[];
        const migratedNotes = notes.map(note => ({
          ...note,
          isProcessing: false,
        }));
        await this.saveNotes(migratedNotes);
        localStorage.removeItem(STORAGE_KEYS.NOTES);
      }

      const oldTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (oldTheme) {
        const theme = JSON.parse(oldTheme) as 'light' | 'dark';
        await this.saveTheme(theme);
        localStorage.removeItem(STORAGE_KEYS.THEME);
      }
    } catch (e) {
      console.error('V0 to V1 migration failed:', e);
    }
  }

  /**
   * Generic get item from storage
   */
  private async getItem<T>(key: string): Promise<T | null> {
    try {
      return await localforage.getItem<T>(key);
    } catch (e) {
      console.error(`Error getting item ${key} from storage:`, e);
      return null;
    }
  }

  /**
   * Generic set item to storage
   */
  private async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      await localforage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`Error setting item ${key} to storage:`, e);
      return false;
    }
  }

  /**
   * Remove item from storage
   */
  private async removeItem(key: string): Promise<void> {
    try {
      await localforage.removeItem(key);
    } catch (e) {
      console.error(`Error removing item ${key} from storage:`, e);
    }
  }

  /**
   * Get all notes from storage (async)
   */
  async getNotes(): Promise<Note[]> {
    await this.initialized;
    const notes = await this.getItem<Note[]>(STORAGE_KEYS.NOTES);
    return notes || [];
  }

  /**
   * Save notes to storage (async)
   */
  async saveNotes(notes: Note[]): Promise<boolean> {
    await this.initialized;
    return this.setItem(STORAGE_KEYS.NOTES, notes);
  }

  /**
   * Get theme from storage (async)
   */
  async getTheme(): Promise<'light' | 'dark' | null> {
    await this.initialized;
    return this.getItem<'light' | 'dark'>(STORAGE_KEYS.THEME);
  }

  /**
   * Save theme to storage (async)
   */
  async saveTheme(theme: 'light' | 'dark'): Promise<boolean> {
    await this.initialized;
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get system theme preference (sync - doesn't require storage)
   */
  getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Get settings from storage (async)
   */
  async getSettings(): Promise<AppSettings | null> {
    await this.initialized;
    return this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
  }

  /**
   * Save settings to storage (async)
   */
  async saveSettings(settings: AppSettings): Promise<boolean> {
    await this.initialized;
    return this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Clear all storage (useful for debugging or reset)
   */
  async clearAll(): Promise<void> {
    try {
      await localforage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }

  /**
   * Export all data as JSON (async)
   */
  async exportData(): Promise<string> {
    await this.initialized;
    const data = {
      notes: await this.getNotes(),
      theme: await this.getTheme(),
      exportedAt: new Date().toISOString(),
      version: APP_CONFIG.STORAGE_VERSION,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON (async)
   */
  async importData(jsonString: string): Promise<boolean> {
    try {
      await this.initialized;
      const data = JSON.parse(jsonString);

      if (data.notes && Array.isArray(data.notes)) {
        await this.saveNotes(data.notes);
      }

      if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
        await this.saveTheme(data.theme);
      }

      return true;
    } catch (e) {
      console.error('Error importing data:', e);
      return false;
    }
  }

  /**
   * Get storage usage information (async)
   */
  async getStorageInfo(): Promise<{ used: number; available: boolean }> {
    try {
      // Estimate storage usage by serializing all keys
      let used = 0;
      await localforage.iterate((value, key) => {
        used += JSON.stringify(value).length + key.length;
      });
      return { used, available: true };
    } catch (e) {
      return { used: 0, available: false };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
