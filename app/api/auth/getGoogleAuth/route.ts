
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encrypt";
import db from "@/lib/db";
import { google } from "googleapis";

// Load environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;


const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export async function GET() {

    try {
        const session = cookies().get('session');
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    
        // Decrypt the session cookie
        const decryptedSession = await decrypt(session.value);
        
        // Find the user in the database
        const user = await db.user.findUnique({
            where: { id: decryptedSession.userId },
        });
    
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
    
        // Decrypt the Google tokens
        const decryptedGoogleTokens = await decrypt(user.googleToken);
    
        // Set the Google credentials
        try {
            oauth2Client.setCredentials({
                access_token: decryptedGoogleTokens.accessToken,
                refresh_token: decryptedGoogleTokens.refreshToken,
            });
        } catch (error) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 500 });
        }

        return NextResponse.json({ message: 'Authorized' });
    } catch (error) {
        return NextResponse.json({ error: "Unauthroized"} , { status: 500 });
    }

}