import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const MASTER_KEY_ALIAS = 'cloudy_journal_v1_key';
const ENCRYPTION_PREFIX = 'v1:aes:';

/**
 * Security Encryption Utility
 * Handles End-to-End Encryption for journal entries.
 */
class EncryptionService {
    private masterKey: string | null = null;

    /**
     * Initializes the encryption service by fetching or generating the master key.
     */
    async initialize(): Promise<void> {
        if (this.masterKey) return;

        let key = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
        
        if (!key) {
            // Generate a random 256-bit key
            key = CryptoJS.lib.WordArray.random(32).toString();
            await SecureStore.setItemAsync(MASTER_KEY_ALIAS, key);
        }
        
        this.masterKey = key;
    }

    /**
     * Encrypts a string using AES-256-CBC.
     */
    async encrypt(text: string): Promise<string> {
        if (!text) return text;
        await this.initialize();
        
        if (!this.masterKey) return text;

        const encrypted = CryptoJS.AES.encrypt(text, this.masterKey).toString();
        return `${ENCRYPTION_PREFIX}${encrypted}`;
    }

    /**
     * Decrypts a string if it has the encryption prefix.
     */
    async decrypt(encryptedText: string): Promise<string> {
        if (!encryptedText || !encryptedText.startsWith(ENCRYPTION_PREFIX)) {
            return encryptedText; // Legacy plain text
        }

        await this.initialize();
        if (!this.masterKey) return encryptedText;

        try {
            const ciphertext = encryptedText.substring(ENCRYPTION_PREFIX.length);
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.masterKey);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedText) {
                console.warn('[Encryption] Decryption resulted in empty string, returning original.');
                return encryptedText;
            }
            
            return decryptedText;
        } catch (error) {
            console.error('[Encryption] Decryption failed:', error);
            return encryptedText;
        }
    }
}

export const encryption = new EncryptionService();
