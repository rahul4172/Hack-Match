// Web Crypto API wrapper for ECDH + AES-GCM
// Generates a local keypair, derives shared secrets, and encrypts/decrypts messages

export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return btoa(exportedAsString);
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return btoa(exportedAsString);
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDerString = atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const binaryDerString = atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

export async function deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(text: string, sharedSecret: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    sharedSecret,
    encoded
  );

  const ivBase64 = btoa(String.fromCharCode.apply(null, Array.from(iv)));
  const cipherBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(ciphertext))));
  
  return JSON.stringify({ iv: ivBase64, ciphertext: cipherBase64 });
}

export async function decryptMessage(encryptedBlob: string, sharedSecret: CryptoKey): Promise<string> {
  try {
    const { iv: ivBase64, ciphertext: cipherBase64 } = JSON.parse(encryptedBlob);
    
    const ivArray = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherArray = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray },
      sharedSecret,
      cipherArray
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    return "[Encrypted message - Decryption failed]";
  }
}
