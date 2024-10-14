import { KeyObject, subtle } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET() {
    // Generate a symmetric key
  const key = await subtle.generateKey({
    name: 'HMAC',
    hash: 'SHA-256',
    length: 256,
  }, true, ['sign', 'verify']);

  const keyObject = KeyObject.from(key);
  // convert keyObject to string
    const keyString = keyObject.export().toString('base64');
    

    // Key generated on client side
    console.log(keyString);

    return NextResponse.json({ message: 'Authorized' });
  // Prints: 32 (symmetric key size in bytes)
}