# Email Setup Guide for PWA Alerts

## ✅ SMTP Already Configured!

Your `.env` file already has SMTP variables configured:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_NAME`

You just need to ensure `SMTP_PASSWORD` has your Gmail app password.

## Step 1: Generate App Password (if not already done)
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2FA if needed
3. Select "Mail" as the app
4. Select "Other (Custom name)" as the device
5. Name it "Team1 PWA Alerts"
6. Click "Generate"
7. Copy the 16-character password (remove spaces)

## Step 2: Verify Environment Variables
Open `.env` and make sure you have:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sarnavo@team1.network
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_NAME=Team1 PWA Alerts
NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT=/api/admin/send-email
```

**Already set?** You likely already have these configured. Just verify `SMTP_PASSWORD` is correct.

## Step 4: Test Email
Run this in your browser console on your app:

```javascript
fetch('/api/admin/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'test@example.com',
    subject: 'Test PWA Alert',
    body: '<h1>Test Email</h1><p>If you receive this, it works!</p>'
  })
}).then(r => r.json()).then(console.log);
```

## Email Recipients
Emails will be sent to **all three** recipients:
- ✅ sarnavo@team1.network
- ✅ sarnavoss.dev@gmail.com  
- ✅ abhishekt.team1@gmail.com

## What Gets Emailed
The PWA monitoring system will send emails for:
- 🚨 **Critical** errors (quota at 95%)
- ⚠️ Service worker failures
- 📊 Weekly health reports (if cron configured)

## Troubleshooting

**Error: "Invalid login"**
- Make sure 2FA is enabled
- Regenerate app password
- Remove spaces from password

**Error: "Less secure app access"**
- Use App Password, not your regular password
- App Passwords bypass this restriction

**No emails received**
- Check spam folder
- Verify Gmail user is correct
- Test with the console command above
