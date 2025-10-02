# Email Configuration for Production

## Issue
Emails are not being sent in production because environment variables are not configured.

## Solution

You need to set the following environment variables on your production server:

```
EMAIL_USER=tournament@malaysiapickleballassociation.org
EMAIL_PASSWORD=xbwqpabrddxxvcox
```

## How to Set Environment Variables (depends on your hosting)

### Option 1: Vercel / Netlify / Similar Platforms
1. Go to your project settings
2. Navigate to "Environment Variables" section
3. Add:
   - Key: `EMAIL_USER`, Value: `tournament@malaysiapickleballassociation.org`
   - Key: `EMAIL_PASSWORD`, Value: `xbwqpabrddxxvcox`
4. Redeploy your application

### Option 2: Traditional Server (VPS, etc.)
1. SSH into your server
2. Navigate to your application directory
3. Edit the `.env` file:
   ```bash
   nano .env
   ```
4. Add or update these lines:
   ```
   EMAIL_USER=tournament@malaysiapickleballassociation.org
   EMAIL_PASSWORD=xbwqpabrddxxvcox
   ```
5. Save and restart your application:
   ```bash
   pm2 restart all  # if using PM2
   # OR
   systemctl restart your-app-name  # if using systemd
   ```

### Option 3: Docker
Add to your `docker-compose.yml` or pass as environment variables:
```yaml
environment:
  - EMAIL_USER=tournament@malaysiapickleballassociation.org
  - EMAIL_PASSWORD=xbwqpabrddxxvcox
```

## Verification

After setting the environment variables, check your server logs when starting the application. You should see:

✅ **Success**: `📧 Email service initialized with: tournament@malaysiapickleballassociation.org`

❌ **Error**: `⚠️ Email service not configured: EMAIL_USER or EMAIL_PASSWORD environment variables are missing`

## Testing

1. Register a new player account in production
2. Check the server logs for email sending status
3. Check the registered email inbox for the confirmation email

## Important Notes

1. **Never commit `.env` file to git** - It contains sensitive credentials
2. **Gmail App Password**: The `EMAIL_PASSWORD` is a Gmail App Password, not your regular Gmail password
3. **If email still not working**, check:
   - Server logs for specific error messages
   - Gmail account settings (ensure SMTP is enabled)
   - Server firewall (port 587 must be open for outbound connections)
   - Server can reach smtp.gmail.com

## Email Types Sent

1. **Registration Success Email** - Sent when player submits registration
2. **Welcome Email** - Sent when admin approves registration
3. **Password Recovery Email** - Sent when player uses "Forgot Password"
