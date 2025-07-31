# 📧 Email Setup Guide for Malaysia Pickleball Association

## Overview
The email system automatically sends emails to players when they register and when their registration is approved.

## 🔧 Email Configuration

### 1. Environment Variables
Add these variables to your `.env` file:

```env
# Email Configuration (required for player registration emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled

#### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** and **Windows Computer** (or Other)
3. Click **Generate**
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Update .env File
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### 3. Alternative Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
```

## 📧 Email Types

### 1. Registration Success Email
**Sent:** Immediately after player registration
**Contains:**
- Welcome message
- Username and password
- Security notice
- Next steps information
- Registration details

### 2. Welcome Email
**Sent:** When admin approves player registration
**Contains:**
- Congratulations message
- Official Player ID
- Member benefits
- Getting started information

## 🔍 Testing Email Configuration

### Test Email Connection
Create a test script to verify email configuration:

```javascript
const EmailService = require('./services/emailService');

async function testEmail() {
  const result = await EmailService.testConnection();
  console.log('Email test result:', result);
}

testEmail();
```

### Check Server Logs
When emails are sent, you'll see logs like:
```
✅ Registration success email sent to: player@example.com
✅ Welcome email sent to approved player: player@example.com
```

If emails fail:
```
⚠️ Failed to send registration email: Error message
❌ Error sending registration email: Detailed error
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Invalid login" Error
- **Cause:** Wrong username/password or 2FA not enabled
- **Solution:** Use App Password for Gmail, enable 2FA

#### 2. "Connection timeout" Error
- **Cause:** Firewall blocking SMTP ports
- **Solution:** Check port 587 is open, try port 465 with secure: true

#### 3. "Authentication failed" Error
- **Cause:** Incorrect SMTP settings
- **Solution:** Verify SMTP_HOST, SMTP_USER, SMTP_PASS

#### 4. Emails not received
- **Cause:** Emails in spam folder
- **Solution:** Check spam/junk folder, whitelist sender

### Debug Mode
Set `NODE_ENV=development` to see detailed email logs.

## 🔒 Security Best Practices

### 1. App Passwords
- ✅ Use App Passwords instead of regular passwords
- ✅ Store passwords in environment variables
- ❌ Never commit passwords to version control

### 2. Email Content
- ✅ Include security warnings about password changes
- ✅ Use professional email templates
- ✅ Include contact information for support

### 3. Error Handling
- ✅ Registration continues even if email fails
- ✅ Log email failures for monitoring
- ✅ Provide fallback success messages

## 📊 Monitoring

### Success Indicators
```
✅ Email service initialized
✅ Registration success email sent to: email@example.com
✅ Welcome email sent to approved player: email@example.com
```

### Warning Signs
```
⚠️ Email service not configured, skipping email
⚠️ Failed to send registration email: reason
❌ Email service connection test failed: error
```

## 🎯 Production Deployment

### 1. Use Professional Email
- Use domain email (e.g., `noreply@malaysiapickleball.org`)
- Set up SPF, DKIM, DMARC records for better deliverability

### 2. Email Service Providers
Consider professional email services:
- **SendGrid** - High deliverability
- **Mailgun** - Developer-friendly
- **Amazon SES** - Cost-effective
- **Office 365** - Business integration

### 3. Monitoring
- Set up email delivery monitoring
- Track bounce rates and failures
- Monitor spam complaints

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Test email configuration with a simple test script
4. Check spam folders for test emails

---

**Note:** The email system is designed to be fault-tolerant. Player registration will succeed even if emails fail to send, ensuring the core functionality remains available.