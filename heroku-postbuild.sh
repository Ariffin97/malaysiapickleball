#!/bin/bash

# Heroku Post-build script for Puppeteer setup
echo "Setting up Puppeteer for Heroku..."

# Set Puppeteer to skip downloading Chromium during npm install
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install Puppeteer dependencies
echo "Installing Puppeteer with system Chrome..."
npm install puppeteer --save

echo "Post-build setup complete!" 