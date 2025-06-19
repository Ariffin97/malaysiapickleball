#!/bin/bash

# 🚀 Malaysia Pickleball - Enhanced Heroku Deployment Script
# This script deploys your enhanced application with all new features

echo "🚀 Starting Enhanced Heroku Deployment for Malaysia Pickleball..."
echo "📱 This version includes JWT authentication for PickleZone mobile app"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Heroku CLI is installed
print_step 1 "Checking Heroku CLI installation"
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed!"
    echo "Please install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi
print_success "Heroku CLI is installed"

# Check if user is logged in to Heroku
print_step 2 "Checking Heroku authentication"
if ! heroku auth:whoami &> /dev/null; then
    print_warning "You are not logged in to Heroku"
    echo "Please run: heroku login"
    exit 1
fi
print_success "Authenticated with Heroku"

# Get app name from user
print_step 3 "Getting Heroku app name"
read -p "Enter your Heroku app name (or press Enter to create new): " APP_NAME

if [ -z "$APP_NAME" ]; then
    print_warning "Creating new Heroku app..."
    APP_NAME="malaysia-pickleball-$(date +%s)"
    heroku create $APP_NAME
    print_success "Created new Heroku app: $APP_NAME"
else
    print_success "Using existing app: $APP_NAME"
fi

# Generate secure secrets
print_step 4 "Generating secure secrets"
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
print_success "Generated secure secrets"

# Get MongoDB URI
print_step 5 "MongoDB Atlas configuration"
echo "Do you have a MongoDB Atlas connection string ready?"
read -p "Enter your MongoDB Atlas URI (or press Enter to skip): " MONGODB_URI

if [ -z "$MONGODB_URI" ]; then
    print_warning "Skipping MongoDB configuration - you'll need to set this manually"
    MONGODB_URI="mongodb://localhost:27017/malaysia-pickleball"
else
    print_success "MongoDB URI configured"
fi

# Set all environment variables
print_step 6 "Setting environment variables"

# Core configuration
heroku config:set NODE_ENV=production --app $APP_NAME
heroku config:set SESSION_SECRET="$SESSION_SECRET" --app $APP_NAME
heroku config:set JWT_SECRET="$JWT_SECRET" --app $APP_NAME
heroku config:set MONGODB_URI="$MONGODB_URI" --app $APP_NAME

# JWT Configuration
heroku config:set JWT_EXPIRES_IN=7d --app $APP_NAME
heroku config:set JWT_REFRESH_EXPIRES_IN=30d --app $APP_NAME
heroku config:set API_VERSION=v1 --app $APP_NAME

# Security Configuration
heroku config:set BCRYPT_ROUNDS=12 --app $APP_NAME
heroku config:set MAX_LOGIN_ATTEMPTS=5 --app $APP_NAME
heroku config:set LOCK_TIME=900000 --app $APP_NAME
heroku config:set SESSION_TIMEOUT=7200000 --app $APP_NAME

# API Rate Limiting
heroku config:set API_RATE_LIMIT_WINDOW=900000 --app $APP_NAME
heroku config:set API_RATE_LIMIT_MAX=100 --app $APP_NAME
heroku config:set AUTH_RATE_LIMIT_MAX=5 --app $APP_NAME

# File Upload Configuration
heroku config:set MAX_FILE_SIZE=5242880 --app $APP_NAME
heroku config:set UPLOAD_PATH=./public/uploads --app $APP_NAME
heroku config:set ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp --app $APP_NAME

# CORS Configuration
heroku config:set ALLOWED_ORIGINS=https://$APP_NAME.herokuapp.com --app $APP_NAME

# Mobile App Configuration
heroku config:set MOBILE_APP_NAME=PickleZone --app $APP_NAME
heroku config:set MOBILE_APP_VERSION=1.0.0 --app $APP_NAME

# Puppeteer Configuration for Heroku
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true --app $APP_NAME
heroku config:set PUPPETEER_EXECUTABLE_PATH=/app/.apt/usr/bin/google-chrome --app $APP_NAME

print_success "Environment variables set"

# Add Heroku buildpacks
print_step 7 "Configuring buildpacks"
heroku buildpacks:clear --app $APP_NAME
heroku buildpacks:add heroku/nodejs --app $APP_NAME
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt --app $APP_NAME
print_success "Buildpacks configured"

# Prepare for deployment
print_step 8 "Preparing for deployment"

# Ensure all files are committed
git add .
if ! git diff --staged --quiet; then
    echo "Committing latest changes..."
    git commit -m "Enhanced deployment with JWT authentication and mobile API support"
    print_success "Changes committed"
else
    print_success "No changes to commit"
fi

# Deploy to Heroku
print_step 9 "Deploying to Heroku"
echo "This may take a few minutes..."
git push heroku main

if [ $? -eq 0 ]; then
    print_success "Deployment successful!"
else
    print_error "Deployment failed! Check the logs with: heroku logs --tail --app $APP_NAME"
    exit 1
fi

# Set up database (if MongoDB URI was provided)
if [ "$MONGODB_URI" != "mongodb://localhost:27017/malaysia-pickleball" ]; then
    print_step 10 "Setting up database"
    heroku run node scripts/setup-fresh-database.js --app $APP_NAME
    print_success "Database initialized"
fi

# Final information
print_step 11 "Deployment complete!"
echo ""
echo "🎉 Your enhanced Malaysia Pickleball application is now live!"
echo ""
echo "📱 App URL: https://$APP_NAME.herokuapp.com"
echo "🔧 Admin Panel: https://$APP_NAME.herokuapp.com/admin/dashboard"
echo "📋 Default Admin: admin / admin123 (CHANGE IMMEDIATELY!)"
echo ""
echo "📱 Mobile API Endpoints for PickleZone:"
echo "   🔐 Login: POST https://$APP_NAME.herokuapp.com/api/auth/player/login"
echo "   👤 Profile: GET https://$APP_NAME.herokuapp.com/api/mobile/player/me"
echo "   🏆 Tournaments: GET https://$APP_NAME.herokuapp.com/api/mobile/tournaments"
echo "   📊 Rankings: GET https://$APP_NAME.herokuapp.com/api/mobile/rankings"
echo "   📸 Profile Pic: POST https://$APP_NAME.herokuapp.com/api/player/profile/picture"
echo ""
echo "🔍 Useful Commands:"
echo "   heroku logs --tail --app $APP_NAME          # View logs"
echo "   heroku config --app $APP_NAME               # View config"
echo "   heroku restart --app $APP_NAME              # Restart app"
echo "   heroku open --app $APP_NAME                 # Open in browser"
echo ""
echo "⚠️  Important: Update your PickleZone mobile app to use:"
echo "   API_BASE_URL: https://$APP_NAME.herokuapp.com/api"
echo ""
echo "✅ Features included in this deployment:"
echo "   • JWT Authentication for mobile apps"
echo "   • Enhanced security and rate limiting"
echo "   • Mobile-optimized API endpoints"
echo "   • Standardized API responses"
echo "   • File upload with security validation"
echo "   • Hybrid authentication (JWT + Session)"
echo ""

# Ask if user wants to open the app
read -p "Would you like to open the app in your browser? (y/n): " OPEN_APP
if [[ $OPEN_APP =~ ^[Yy]$ ]]; then
    heroku open --app $APP_NAME
fi

print_success "Deployment script completed!"
echo "📖 Check SETUP_COMPLETE.md for detailed API documentation" 