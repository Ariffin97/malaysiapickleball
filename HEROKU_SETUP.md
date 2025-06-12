# Heroku Setup Guide for Malaysia Pickleball PDF Downloads

This guide will help you configure your Heroku app to properly support PDF generation using Puppeteer.

## Prerequisites

1. Heroku CLI installed
2. Your app already deployed to Heroku

## Setup Steps

### 1. Add Buildpacks

You need to add the apt buildpack to install system dependencies for Chrome/Chromium:

```bash
heroku buildpacks:add --index 1 heroku-community/apt
heroku buildpacks:add --index 2 heroku/nodejs
```

### 2. Set Environment Variables

Set the following environment variables in your Heroku app:

```bash
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
heroku config:set PUPPETEER_EXECUTABLE_PATH=/app/.apt/usr/bin/google-chrome-stable
```

### 3. Alternative Chrome Setup

If the above doesn't work, try this alternative:

```bash
heroku config:set PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 4. Deploy the Changes

Deploy your updated code:

```bash
git add .
git commit -m "Add Puppeteer support for Heroku"
git push heroku main
```

### 5. Verify Setup

Check your app logs to ensure everything is working:

```bash
heroku logs --tail
```

## Alternative Setup (If Above Fails)

If the buildpack approach doesn't work, try using a different Chrome buildpack:

```bash
heroku buildpacks:clear
heroku buildpacks:add --index 1 https://github.com/heroku/heroku-buildpack-google-chrome
heroku buildpacks:add --index 2 heroku/nodejs
```

Then set:

```bash
heroku config:set PUPPETEER_EXECUTABLE_PATH=/app/.chrome/google-chrome
```

## Troubleshooting

### Common Issues

1. **Chrome not found**: Make sure the buildpack is installed and environment variables are set correctly.

2. **Out of memory**: Heroku's free tier has limited memory. Upgrade to a paid plan if needed.

3. **Timeout errors**: Increase timeout values or use the simple PDF route as fallback.

### Testing PDF Generation

You can test PDF generation by accessing:
- `/tournament/download-pdf` - Main PDF route
- `/tournament/download-pdf-simple` - Simplified fallback route
- `/tournament/test-pdf-template` - Test template rendering

### Debug Commands

```bash
# Check buildpacks
heroku buildpacks

# Check environment variables
heroku config

# Check app logs
heroku logs --tail

# Run bash on Heroku (if needed)
heroku run bash
```

## Files Added/Modified

- `Aptfile` - System dependencies for Chrome
- `.puppeteerrc.cjs` - Puppeteer configuration
- `heroku-postbuild.sh` - Post-build setup script
- `package.json` - Added heroku-postbuild script
- `server.js` - Updated Puppeteer configuration

## Support

If you continue to have issues:

1. Check the Heroku logs for specific error messages
2. Verify all buildpacks are installed correctly
3. Test the simple PDF route first
4. Consider using a different PDF generation library if Puppeteer continues to fail 