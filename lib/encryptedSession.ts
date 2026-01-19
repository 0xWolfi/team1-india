/**
 * Encrypted Session Storage
 * Securely stores authentication tokens offline using Web Crypto API
 */

interface OfflineSession {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  metadata?: Record<string, any>;
}

const SESSION_KEY = 'encrypted-session';
const ENCRYPTION_ALGORITHM = 'AES-GCM';

class EncryptedSessionManager {
  private cryptoKey: CryptoKey | null = null;

  /**
   * Initialize encryption key
   */
  async init(): Promise<void> {
    if (this.cryptoKey) return;

    // Derive key from device-specific identifier
    const deviceId = await this.getDeviceId();
    const keyMaterial = await this.deriveKeyMaterial(deviceId);
    
    this.cryptoKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('team1-pwa-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ENCRYPTION_ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Save encrypted session
   */
  async saveSession(session: OfflineSession): Promise<void> {
    await this.init();
    if (!this.cryptoKey) throw new Error('Encryption key not initialized');

    try {
      const encrypted = await this.encrypt(JSON.stringify(session));
      sessionStorage.setItem(SESSION_KEY, encrypted);
      console.log('🔐 Session saved (encrypted)');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Restore encrypted session
   */
  async restoreSession(): Promise<OfflineSession | null> {
    await this.init();
    if (!this.cryptoKey) return null;

    try {
      const encrypted = sessionStorage.getItem(SESSION_KEY);
      if (!encrypted) return null;

      const decrypted = await this.decrypt(encrypted);
      const session = JSON.parse(decrypted) as OfflineSession;

      // Check expiration
      if (session.expiresAt < Date.now()) {
        console.log('⏰ Session expired');
        this.clearSession();
        return null;
      }

      console.log('🔓 Session restored');
      return session;
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearSession(); // Clear corrupted session
      return null;
    }
  }

  /**
   * Clear session (logout)
   */
  clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    console.log('🗑️ Session cleared');
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.cryptoKey) throw new Error('No encryption key');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
      },
      this.cryptoKey,
      encoded
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.cryptoKey) throw new Error('No encryption key');

    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv,
      },
      this.cryptoKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem('device-id');
    
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
      localStorage.setItem('device-id', deviceId);
    }

    return deviceId;
  }

  /**
   * Derive key material from device ID
   */
  private async deriveKeyMaterial(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    const binary = String.fromCharCode(...Array.from(buffer));
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Check if session exists
   */
  hasSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  }

  /**
   * Get session without decryption (for checking existence)
   */
  async getSessionMetadata(): Promise<{ expiresAt: number } | null> {
    const session = await this.restoreSession();
    return session ? { expiresAt: session.expiresAt } : null;
  }
}

// Export singleton
export const encryptedSession = new EncryptedSessionManager();

/**
 * React Hook for encrypted session management
 */
import { useState, useEffect } from 'react';

export function useEncryptedSession() {
  const [session, setSession] = useState<OfflineSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    setLoading(true);
    const restored = await encryptedSession.restoreSession();
    setSession(restored);
    setLoading(false);
  };

  const saveSession = async (sessionData: OfflineSession) => {
    await encryptedSession.saveSession(sessionData);
    setSession(sessionData);
  };

  const clearSession = () => {
    encryptedSession.clearSession();
    setSession(null);
  };

  return {
    session,
    loading,
    saveSession,
    clearSession,
    hasSession: session !== null,
  };
}
