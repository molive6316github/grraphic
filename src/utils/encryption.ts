// Client-side encryption utilities
import CryptoJS from 'crypto-js';

// Generate a key from user session (in production, use a more secure method)
const getEncryptionKey = (): string => {
  // In production, this should be derived from user authentication
  // For now, we'll use a combination of user session and a secret
  const userSession = sessionStorage.getItem('supabase.auth.token') || 'default';
  const secret = import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-secret-key';
  return CryptoJS.SHA256(userSession + secret).toString();
};

export const encryptData = (data: any): string => {
  try {
    const key = getEncryptionKey();
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback: return original data as string if encryption fails
    return JSON.stringify(data);
  }
};

export const decryptData = (encryptedData: string): any => {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    
    // Check if decryption was successful by checking sigBytes
    if (decrypted.sigBytes <= 0 || decrypted.sigBytes === undefined) {
      // If decryption fails, try to parse as unencrypted data (backward compatibility)
      try {
        return JSON.parse(encryptedData);
      } catch (parseError) {
        console.error('Failed to parse unencrypted data:', parseError);
        return null;
      }
    }
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString || decryptedString === '[object Object]' || decryptedString.trim() === '') {
      // If decryption produces invalid string, try to parse as unencrypted data
      try {
        return JSON.parse(encryptedData);
      } catch (parseError) {
        console.error('Failed to parse fallback data:', parseError);
        return null;
      }
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback: try to parse as unencrypted JSON
    try {
      return JSON.parse(encryptedData);
    } catch (parseError) {
      console.error('Failed to parse data:', parseError);
      return null;
    }
  }
};

export const hashSensitiveData = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};