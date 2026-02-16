import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 2000;

/**
 * SecureStoreAdapter for Supabase
 * Handles the 2048 byte limit on Android by chunking large strings.
 */
export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // 1. Check for manifest (number of chunks)
      const manifestKey = `${key}_manifest`;
      const manifest = await SecureStore.getItemAsync(manifestKey);
      
      if (!manifest) {
        // Fallback or single small item
        return await SecureStore.getItemAsync(key);
      }

      const numChunks = parseInt(manifest, 10);
      let fullString = '';

      for (let i = 0; i < numChunks; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
        if (!chunk) return null; // Corrupted session?
        fullString += chunk;
      }

      return fullString;
    } catch (e) {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        // Simple write
        await SecureStore.setItemAsync(key, value);
        await SecureStore.deleteItemAsync(`${key}_manifest`);
        return;
      }

      // Chunked write
      const chunks = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.substring(i, i + CHUNK_SIZE));
      }

      // Save manifest first
      await SecureStore.setItemAsync(`${key}_manifest`, chunks.length.toString());

      // Save chunks
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_${i}`, chunks[i]);
      }
      
      // Clean up primary key if it was used for a small value before
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStoreAdapter] Failed to set item:', e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const manifestKey = `${key}_manifest`;
      const manifest = await SecureStore.getItemAsync(manifestKey);
      
      if (manifest) {
        const numChunks = parseInt(manifest, 10);
        for (let i = 0; i < numChunks; i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
        await SecureStore.deleteItemAsync(manifestKey);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.error('[SecureStoreAdapter] Failed to remove item:', e);
    }
  },
};
