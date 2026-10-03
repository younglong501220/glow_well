import { SaveGameData } from './types';
import { SAVE_STORAGE_KEY } from './constants';

export const SaveManager = {
  hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  },

  getSaveMeta(): { savedAt: number; eggs: number; roomKey: string } | null {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      const data: SaveGameData = JSON.parse(raw);
      return {
        savedAt: data.savedAt,
        eggs: data.eggsCollected,
        roomKey: `${data.currentRoom.x},${data.currentRoom.y}`,
      };
    } catch {
      return null;
    }
  },

  save(data: SaveGameData): boolean {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save game:', e);
      return false;
    }
  },

  load(): SaveGameData | null {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      const data: SaveGameData = JSON.parse(raw);
      if (!data || data.version !== 1) return null;
      return data;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear save game:', e);
    }
  },
};
