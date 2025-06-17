#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔐 Environment File Security Checker');
console.log('=====================================\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

// Security checks
const checks = {
  hasSessionSecret: false,
  sessionSecretStrong: false,
  hasProductionPassword: false,
  hasWeakPasswords: false,
  inGitignore: false,
  filePermissions: 'unknown'
};

console.log('🔍 Running security checks...\n');

// Check 1: Session Secret
envLines.forEach(line => {
  if (line.startsWith('SESSION_SECRET=')) {
    checks.hasSessionSecret = true;
    const secret = line.split('=')[1];
    if (secret.length >= 64 && secret !== 'your-super-secret-session-key-change-this-in-production') {
      checks.sessionSecretStrong = true;
    }
  }
  
  // Check for weak/default passwords
  if (line.includes('admin123') || line.includes('password123') || line.includes('change-me')) {
    checks.hasWeakPasswords = true;
  }
  
  // Check for production indicators
  if (line.includes('NODE_ENV=production')) {
    checks.hasProductionPassword = true;
  }
});

// Check 2: .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env')) {
    checks.inGitignore = true;
  }
}

// Display results
console.log('📋 Security Check Results:');
console.log('==========================');

console.log(`${checks.hasSessionSecret ? '✅' : '❌'} Session secret exists`);
console.log(`${checks.sessionSecretStrong ? '✅' : '❌'} Session secret is strong (64+ chars)`);
console.log(`${!checks.hasWeakPasswords ? '✅' : '❌'} No weak/default passwords detected`);
console.log(`${checks.inGitignore ? '✅' : '❌'} .env file is in .gitignore`);

// File permissions check (Windows specific)
try {
  const stats = fs.statSync(envPath);
  console.log(`✅ File exists and is readable`);
} catch (error) {
  console.log(`❌ File permission error: ${error.message}`);
}

console.log('\n🛡️ Security Recommendations:');
console.log('=============================');

if (!checks.sessionSecretStrong) {
  console.log('⚠️  Generate a stronger session secret:');
  console.log('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

if (checks.hasWeakPasswords) {
  console.log('⚠️  Remove weak/default passwords from .env');
}

if (!checks.inGitignore) {
  console.log('⚠️  Add .env to .gitignore file');
}

console.log('\n🔒 Additional Security Tips:');
console.log('============================');
console.log('• Never commit .env to version control');
console.log('• Use different .env files for different environments');
console.log('• Regularly rotate secrets and passwords');
console.log('• Use environment-specific credentials');
console.log('• Consider using a secrets management service for production');

// Generate backup reminder
console.log('\n💾 Backup Reminder:');
console.log('===================');
console.log('• Keep a secure backup of your .env file');
console.log('• Store production credentials separately');
console.log('• Document which services use which credentials');

console.log('\n✅ Security check completed!'); 