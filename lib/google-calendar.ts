import { OAuth2Client } from 'google-auth-library';

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
        
        // Determine redirect URI
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
        const oauth2Client = new OAuth2Client(
            clientId,
            clientSecret,
            redirectUri
        );

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Test implementation: simple check if we can get a token
        // This will throw if credentials are invalid
        try {
            await oauth2Client.getAccessToken();
        } catch (tokenError: any) {
             const errorDetails = {
                error: tokenError.message,
                code: tokenError.code,
                clientIdPrefix: clientId?.substring(0, 20) + '...',
                redirectUri,
                hasRefreshToken: !!refreshToken,
                environment: process.env.NODE_ENV
            };
            console.error('Token refresh error details:', errorDetails);
            
            if (tokenError.message?.includes('unauthorized_client') || tokenError.code === 'unauthorized_client') {
                 throw new Error('OAuth authorization failed. Please regenerate refresh token.');
            }
            throw tokenError;
        }

        // Prepare event data
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
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 15 }
                ]
            }
        };

        // Make API request using proper types
        // url: https://www.googleapis.com/calendar/v3/calendars/primary/events
        const response = await oauth2Client.request<any>({
            url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            method: 'POST',
            params: {
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            },
            data: event
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
