import CryptoJS from "crypto-js";

// Load key from .env.local
// IF this is undefined, encryption will fail (which is good, so you know it's missing)
const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY;

if (!SECRET_KEY) {
  console.error("CRITICAL: REACT_APP_ENCRYPTION_KEY is missing in .env.local");
}

export const encryptData = (text) => {
  if (!text || !SECRET_KEY) return "";
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptData = (cipherText) => {
  if (!cipherText || !SECRET_KEY) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (e) {
    console.error("Decryption failed", e);
    return "";
  }
};
