# Google Calendar API Setup Guide

This guide will help you set up Google Calendar API credentials to enable Google Meet scheduling in the Operations section.

## Prerequisites

- A Google account (the one that will be the host/organizer of meetings)
- Access to Google Cloud Console
- Admin access to your application's environment variables

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Team1India Calendar")
5. Click "Create"

### Step 2: Enable Google Calendar API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: "Team1India"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Click "Save and Continue"
   - Add test users (your email) if needed
   - Click "Save and Continue"
   - Review and click "Back to Dashboard"

4. Now create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Team1India Calendar Client"
   - Authorized redirect URIs:
     - For local development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"
   - **Copy the Client ID and Client Secret** - you'll need these!

### Step 4: Get Refresh Token

You need to authorize your application once to get a refresh token. Here's how:

#### Option A: Using OAuth 2.0 Playground (Recommended)

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your **Client ID** and **Client Secret** from Step 3
5. In the left panel, find "Calendar API v3"
6. Select the scope: `https://www.googleapis.com/auth/calendar`
7. Click "Authorize APIs"
8. Sign in with the Google account that will host meetings
9. Click "Allow" to grant permissions
10. Click "Exchange authorization code for tokens"
11. **Copy the "Refresh token"** - this is what you need!

#### Option B: Using a Script (Alternative)

Create a temporary script to get the refresh token:

```javascript
// get-refresh-token.js
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/api/auth/callback/google'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('Visit this URL:', authUrl);
console.log('After authorization, you will be redirected. Copy the "code" parameter from the URL.');
```

Run it, visit the URL, authorize, then use the code to get the refresh token.

### Step 5: Set Environment Variables

Add these to your `.env.local` file (or your production environment):

```env
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_HOST_EMAIL=your-email@example.com
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

**Important Notes:**
- `GOOGLE_HOST_EMAIL`: The email address of the Google account that will be the meeting host/organizer
- `GOOGLE_REDIRECT_URI`: Should match one of the redirect URIs you configured in Step 3
- For production, update `GOOGLE_REDIRECT_URI` to your production domain

### Step 6: Verify Setup

1. Restart your development server
2. Go to `/core/operations`
3. Click "Schedule Meeting"
4. Fill in the form and try scheduling a test meeting
5. Check that:
   - The meeting is created in Google Calendar
   - A Google Meet link is generated
   - Emails are sent to attendees

## Troubleshooting

### Error: "Google Calendar credentials not configured"
- Make sure all environment variables are set correctly
- Restart your server after adding environment variables

### Error: "Invalid refresh token"
- The refresh token may have expired or been revoked
- Generate a new refresh token using Step 4

### Error: "Insufficient permissions"
- Make sure you've enabled Google Calendar API
- Check that the OAuth consent screen is configured
- Verify the refresh token was generated with the correct scope

### Meetings not appearing in calendar
- Check that `GOOGLE_HOST_EMAIL` matches the account used to generate the refresh token
- Verify the account has calendar access enabled

### Emails not being sent
- Check your SMTP configuration in environment variables
- Verify email service is working (test with other features)

## Security Best Practices

1. **Never commit credentials to git** - Always use environment variables
2. **Use different credentials for development and production**
3. **Rotate refresh tokens periodically** - If compromised, revoke and regenerate
4. **Limit OAuth scopes** - Only request the minimum permissions needed
5. **Monitor API usage** - Set up alerts in Google Cloud Console

## Production Deployment

1. Update `GOOGLE_REDIRECT_URI` to your production domain
2. Add your production domain to authorized redirect URIs in Google Cloud Console
3. Update OAuth consent screen with production URLs
4. Submit for verification if your app will have many users (not required for internal use)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test the Google Calendar API directly using the OAuth Playground
