import { google } from 'googleapis';

interface CreateMeetingParams {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees: string[];
}

export async function createGoogleMeetEvent({
    title,
    description,
    startTime,
    endTime,
    attendees
}: CreateMeetingParams) {
    try {
        // Get OAuth credentials from environment
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        const hostEmail = process.env.GOOGLE_HOST_EMAIL;

        if (!clientId || !clientSecret || !refreshToken || !hostEmail) {
            throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_HOST_EMAIL in environment variables.');
        }

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
        );

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Get access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Create Calendar API client
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Create event with Google Meet
        const event = {
            summary: title,
            description: description || '',
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            attendees: attendees.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            organizer: {
                email: hostEmail
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 15 } // 15 minutes before
                ]
            }
        };

        // Insert event
        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: event,
            sendUpdates: 'all' // Send invites to all attendees
        });

        if (!response.data.id || !response.data.hangoutLink) {
            throw new Error('Failed to create Google Meet event');
        }

        return {
            eventId: response.data.id,
            meetLink: response.data.hangoutLink,
            htmlLink: response.data.htmlLink || '',
            startTime: response.data.start?.dateTime || startTime.toISOString(),
            endTime: response.data.end?.dateTime || endTime.toISOString()
        };
    } catch (error: any) {
        console.error('Google Calendar API Error:', error);
        throw new Error(`Failed to create Google Meet: ${error.message || 'Unknown error'}`);
    }
}
