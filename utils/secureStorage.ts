/**
 * Güvenli Storage Utility
 * XSS saldırılarına karşı koruma için sessionStorage kullanır
 * ve verileri basit encryption ile saklar
 */

// Basit encryption/decryption (production'da daha güçlü bir yöntem kullanılmalı)
const ENCRYPTION_KEY = 'tedris-secure-storage-v1';

/**
 * Basit string encryption (Base64 + obfuscation)
 * NOT: Bu production-grade encryption değil, sadece temel koruma
 */
function encrypt(data: string): string {
    try {
        // JSON string'i Base64'e çevir
        const base64 = btoa(data);

        // Basit obfuscation: karakterleri ters çevir ve key ekle
        const obfuscated = base64.split('').reverse().join('');

        return `${ENCRYPTION_KEY}:${obfuscated}`;
    } catch (error) {
        console.error('[SecureStorage] Encryption error:', error);
        return data; // Fallback: şifrelenmemiş veri
    }
}

/**
 * Basit string decryption
 */
function decrypt(encrypted: string): string {
    try {
        // Key kontrolü
        if (!encrypted.startsWith(ENCRYPTION_KEY + ':')) {
            return encrypted; // Şifrelenmemiş veri
        }

        // Key'i kaldır
        const obfuscated = encrypted.substring(ENCRYPTION_KEY.length + 1);

        // Obfuscation'ı geri al
        const base64 = obfuscated.split('').reverse().join('');

        // Base64'ten JSON'a çevir
        return atob(base64);
    } catch (error) {
        console.error('[SecureStorage] Decryption error:', error);
        return encrypted; // Fallback: şifreli veri
    }
}

/**
 * Güvenli Storage Interface
 */
export const secureStorage = {
    /**
     * Veri kaydet (sessionStorage + encryption)
     */
    setItem: (key: string, value: any): void => {
        try {
            const jsonString = JSON.stringify(value);
            const encrypted = encrypt(jsonString);
            sessionStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('[SecureStorage] setItem error:', error);
        }
    },

    /**
     * Veri oku (decryption + parse)
     */
    getItem: <T = any>(key: string): T | null => {
        try {
            const encrypted = sessionStorage.getItem(key);
            if (!encrypted) return null;

            const decrypted = decrypt(encrypted);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error('[SecureStorage] getItem error:', error);
            return null;
        }
    },

    /**
     * Veri sil
     */
    removeItem: (key: string): void => {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error('[SecureStorage] removeItem error:', error);
        }
    },

    /**
     * Tüm verileri sil
     */
    clear: (): void => {
        try {
            sessionStorage.clear();
        } catch (error) {
            console.error('[SecureStorage] clear error:', error);
        }
    },

    /**
     * Key var mı kontrol et
     */
    hasItem: (key: string): boolean => {
        try {
            return sessionStorage.getItem(key) !== null;
        } catch (error) {
            console.error('[SecureStorage] hasItem error:', error);
            return false;
        }
    }
};

/**
 * Test progress için özel storage
 * Browser kapatılınca otomatik silinir (sessionStorage)
 */
export const testProgressStorage = {
    save: (testId: string, answers: any): void => {
        secureStorage.setItem(`test-progress-${testId}`, {
            answers,
            timestamp: Date.now(),
            version: '1.0'
        });
    },

    load: (testId: string): any | null => {
        const data = secureStorage.getItem(`test-progress-${testId}`);
        if (!data) return null;

        // 24 saatten eski progress'leri sil
        const age = Date.now() - (data.timestamp || 0);
        if (age > 24 * 60 * 60 * 1000) {
            secureStorage.removeItem(`test-progress-${testId}`);
            return null;
        }

        return data.answers;
    },

    clear: (testId: string): void => {
        secureStorage.removeItem(`test-progress-${testId}`);
    }
};

export default secureStorage;
