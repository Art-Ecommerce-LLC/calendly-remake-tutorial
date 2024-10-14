
import * as jose from 'jose'

const secretKey = jose.base64url.decode(process.env.ENCRYPTION_SECRET!); // Ensure it's defined

// Function to encrypt a payload
export async function encrypt(payload: Record<string, string | Date>): Promise<string> {
  try {
    const jwe = await new jose.EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) // Direct encryption with AES-256-GCM
    .encrypt(secretKey); // Encrypt with the symmetric key
    return jwe;
    
  } catch (error) {
    throw new Error('Invalid token');
}
}

// Function to decrypt a payload
export async function decrypt(encryptedPayload: string): Promise<Record<string,string>> {
  try {

    const { plaintext } = await jose.compactDecrypt(encryptedPayload, secretKey);
    const decodedPayload = new TextDecoder().decode(plaintext);

    const payload = JSON.parse(decodedPayload);
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date(Date.now())){
      throw new Error('Token expired');
    }

    return payload;

  } catch (error) {
    throw new Error('Invalid token');
  }
}