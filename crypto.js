// crypto.js - Web Crypto API Implementation

const SALT = new TextEncoder().encode("AccountPasswordManagerSalt");
const ITERATIONS = 100000;

/**
 * Derives an AES-GCM key from the given magic number.
 * @param {string} magicNumber 
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(magicNumber) {
    if (!magicNumber) magicNumber = "";
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(magicNumber),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: SALT,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a plaintext string using the derived key.
 * @param {string} plaintext 
 * @param {string} magicNumber 
 * @returns {Promise<string>} Base64 encoded JSON string containing IV and Ciphertext
 */
export async function encrypt(plaintext, magicNumber) {
    const key = await deriveKey(magicNumber);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedPlaintext = new TextEncoder().encode(plaintext);
    
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encodedPlaintext
    );
    
    // Combine IV and Ciphertext
    const ciphertextArray = Array.from(new Uint8Array(ciphertextBuffer));
    const ivArray = Array.from(iv);
    
    const data = {
        iv: btoa(String.fromCharCode.apply(null, ivArray)),
        ciphertext: btoa(String.fromCharCode.apply(null, ciphertextArray))
    };
    
    return btoa(JSON.stringify(data));
}

/**
 * Decrypts a ciphertext string using the derived key.
 * If the magic number is incorrect, returns garbled text.
 * @param {string} encryptedData 
 * @param {string} magicNumber 
 * @returns {Promise<string>} Plaintext or Garbled text
 */
export async function decrypt(encryptedData, magicNumber) {
    try {
        const decodedStr = atob(encryptedData);
        const data = JSON.parse(decodedStr);
        
        const ivStr = atob(data.iv);
        const ivArray = new Uint8Array(ivStr.length);
        for (let i = 0; i < ivStr.length; i++) ivArray[i] = ivStr.charCodeAt(i);
        
        const cipherStr = atob(data.ciphertext);
        const cipherArray = new Uint8Array(cipherStr.length);
        for (let i = 0; i < cipherStr.length; i++) cipherArray[i] = cipherStr.charCodeAt(i);
        
        const key = await deriveKey(magicNumber);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivArray },
            key,
            cipherArray
        );
        
        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        // Fallback for incorrect magic number or corrupted data
        // Produce some "garbled" looking text to mimic DES3 ECB wrong-key output
        return generateGarbledText(encryptedData, magicNumber);
    }
}

/**
 * Helper to generate deterministic garbled text based on inputs.
 */
function generateGarbledText(encryptedData, magicNumber) {
    let garbled = "";
    const seed = encryptedData.substring(0, 10) + magicNumber;
    for(let i = 0; i < 16; i++) {
        const charCode = (seed.charCodeAt(i % seed.length) * (i + 1)) % 126;
        garbled += String.fromCharCode(charCode < 33 ? charCode + 33 : charCode);
    }
    return garbled;
}
