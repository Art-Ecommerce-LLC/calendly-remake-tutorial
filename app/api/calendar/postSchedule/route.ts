import { NextResponse, NextRequest} from 'next/server';
import db from '@/lib/db';
// zod schema
import { z } from 'zod';
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/encrypt';
import { google } from 'googleapis';
import { addDays, addMinutes} from 'date-fns';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDatetime: z.string().min(1, 'Start date is required'),
  endDatetime: z.string().min(1, 'End date is required'),
  appointmentLength: z.string().min(1, 'Appointment length is required'),
})

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);



export async function POST(request: NextRequest) {
  try {
  const body = await request.json(); 
  const { 
    title, 
    description, 
    startDatetime,
    endDatetime,
    appointmentLength,
  } = schema.parse(body);
  


  const session = cookies().get('session');
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const descryptedSession = await decrypt(session.value);

    const userId = descryptedSession.userId;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { googleToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  const decryptedGoogleTokens = await decrypt(user.googleToken);


  oauth2Client.setCredentials({
    access_token: decryptedGoogleTokens.accessToken,
    refresh_token: decryptedGoogleTokens.refreshToken,
  });


  let startIndex = new Date(startDatetime);
  const endTime = new Date(endDatetime);
  const startTime = new Date(startDatetime);
  let endIndex = new Date(startDatetime);
  endIndex.setHours(endTime.getHours());
  endIndex.setMinutes(endTime.getMinutes());

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  while (startIndex < endTime) {

    const end = addMinutes(startIndex, Number(appointmentLength));

    await db.event.create({
      data: {
        title,
        description,
        date: startIndex.toISOString(),
        googleToken: user.googleToken,
      },
    });
    // Create the event in Google Calendar

    const eventRequest = {
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        resource: {
          summary: title,
          description,
          start: {
            dateTime: startIndex.toISOString(),
          },
          end: {
            dateTime: end.toISOString(),
          },
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`, // Unique ID for the request
              conferenceSolutionKey: {
                type: 'hangoutsMeet', // This specifies that it's a Google Meet event
              },
            },
          },
        },
        conferenceDataVersion: 1, // Enable conference data for Google Meet
      };
      const newGoogleEvent = await calendar.events.insert(eventRequest);
      // Store the Google Event ID in the database
      await db.event.update({
        where: { date : startIndex.toISOString() },
        data: {
          googleEventId: newGoogleEvent.data.id
        },
      });

    startIndex = end;

    if (startIndex >= endIndex) {
      startIndex = addDays(startIndex, 1);
      startIndex.setHours(startTime.getHours());
      startIndex.setMinutes(startTime.getMinutes());
      endIndex = new Date(startIndex);
      endIndex.setHours(endTime.getHours());
      endIndex.setMinutes(endTime.getMinutes());
    }
  }

 
  return NextResponse.json({ message: 'Event created' }, { status: 201 });
} catch (error) {
  return NextResponse.json({ error: 'Error creating event' }, { status: 500 });
}
}

