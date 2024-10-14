// app/api/callbacks/google/route.ts
import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import db from '@/lib/db'
import{ encrypt } from '@/lib/encrypt' 
import { cookies } from 'next/headers'

// Load environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const NODE_URL = process.env.NODE_URL!;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    // Get user info (email, etc.) from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      return NextResponse.json({ error: 'Failed to retrieve user info' }, { status: 500 });
    }
    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Failed to retrieve tokens' }, { status: 500 });
    }
    // store the encrypted user's info in the database
    // Encrypt thhe user's access token and refresh token before storing them in the database
    const encryptedGoogleTokens = await encrypt({accessToken, refreshToken});

    // Create a new service token to store in the cookies
    const newUser = await db.user.create({
      data: {
        email: userInfo.email,
        googleToken: encryptedGoogleTokens,
      },
    });

    const encryptedSession = await encrypt({ userId : newUser.id });

    const isProduction = process.env.NODE_ENV === 'production';

    cookies().set('session' , encryptedSession, {
      httpOnly: true,
      secure: isProduction,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path : '/'
  });
    return NextResponse.redirect(`${NODE_URL}/`);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}