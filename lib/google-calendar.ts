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
        
        // Determine redirect URI - prioritize GOOGLE_REDIRECT_URI, then use NEXTAUTH_URL, then default
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
            (process.env.NEXTAUTH_URL 
                ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
                : 'http://localhost:3000/api/auth/callback/google');

        if (!clientId || !clientSecret || !refreshToken || !hostEmail) {
            const missing = [];
            if (!clientId) missing.push('GOOGLE_CLIENT_ID');
            if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
            if (!refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');
            if (!hostEmail) missing.push('GOOGLE_HOST_EMAIL');
            throw new Error(`Google Calendar credentials not configured. Missing: ${missing.join(', ')}`);
        }

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Get access token
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
        } catch (tokenError: any) {
            const errorDetails = {
                error: tokenError.message,
                code: tokenError.code,
                clientIdPrefix: clientId?.substring(0, 20) + '...',
                redirectUri,
                hasRefreshToken: !!refreshToken,
                refreshTokenPrefix: refreshToken?.substring(0, 20) + '...',
                environment: process.env.NODE_ENV
            };
            
            console.error('Token refresh error details:', errorDetails);
            
            if (tokenError.message?.includes('unauthorized_client') || tokenError.code === 'unauthorized_client') {
                const errorMessage = `OAuth authorization failed (unauthorized_client).

CRITICAL: The refresh token must be regenerated with the EXACT same credentials.

Current Configuration:
- Client ID: ${clientId?.substring(0, 30)}...
- Redirect URI: ${redirectUri}
- Environment: ${process.env.NODE_ENV}

REQUIRED ACTIONS:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Verify your OAuth Client ID matches: ${clientId?.substring(0, 30)}...
3. Verify redirect URI "${redirectUri}" is EXACTLY listed in Authorized redirect URIs
4. Go to OAuth 2.0 Playground (https://developers.google.com/oauthplayground/)
5. Click gear icon → "Use your own OAuth credentials"
6. Enter the SAME Client ID and Secret from step 2
7. Select scope: https://www.googleapis.com/auth/calendar
8. Complete authorization and copy the NEW refresh token
9. Update GOOGLE_REFRESH_TOKEN in Vercel environment variables
10. Redeploy or wait for environment variables to refresh

The refresh token MUST be generated with the exact same Client ID/Secret/Redirect URI combination.`;
                
                throw new Error(errorMessage);
            }
            throw tokenError;
        }

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
