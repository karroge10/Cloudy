import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1024; // Power of 2, safe for Android key/value limits

/**
 * SecureStoreAdapter for Supabase
 * Handles the 2048 byte limit on Android by chunking large strings.
 * Implementation is manifest-last to ensure atomic-like reads.
 */
export const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const manifestKey = `${key}_manifest`;
      const manifest = await SecureStore.getItemAsync(manifestKey);
      
      if (!manifest) {
        // Fallback or small item
        return await SecureStore.getItemAsync(key);
      }

      const numChunks = parseInt(manifest, 10);
      const chunkPromises = [];
      for (let i = 0; i < numChunks; i++) {
        chunkPromises.push(SecureStore.getItemAsync(`${key}_${i}`));
      }

      const chunks = await Promise.all(chunkPromises);
      if (chunks.some(c => c === null)) {
        console.warn(`[SecureStore] Found manifest but chunks are missing for: ${key}`);
        return null;
      }

      return chunks.join('');
    } catch (e) {
      console.error('[SecureStore] getItem failure:', e);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        await SecureStore.deleteItemAsync(`${key}_manifest`);
        return;
      }

      const chunks = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.substring(i, i + CHUNK_SIZE));
      }

      // 1. Save chunks FIRST
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_${i}`, chunks[i]);
      }

      // 2. Save manifest LAST (Atomic flip)
      await SecureStore.setItemAsync(`${key}_manifest`, chunks.length.toString());
      
      // 3. Clean up primary key
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] setItem failure:', e);
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
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error('[SecureStore] removeItem failure:', e);
    }
  },
};
