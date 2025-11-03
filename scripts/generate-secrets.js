/**
 * Generate Secure Secrets for Production
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Secure Secret Generator for WorkOrbit\n');
console.log('='.repeat(60) + '\n');

// Generate JWT secrets
console.log('📝 JWT Secrets:\n');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);

// Generate encryption keys
console.log('\n📝 Encryption Keys:\n');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const backupEncryptionKey = crypto.randomBytes(32).toString('hex');

console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('BACKUP_ENCRYPTION_KEY=' + backupEncryptionKey);

// Generate session secret
console.log('\n📝 Session Secret:\n');
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

// Generate API keys
console.log('\n📝 API Keys:\n');
const apiKey = crypto.randomBytes(24).toString('base64');
console.log('API_KEY=' + apiKey);

// Generate webhook secrets
console.log('\n📝 Webhook Secrets:\n');
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('WEBHOOK_SECRET=' + webhookSecret);

// Security recommendations
console.log('\n' + '='.repeat(60));
console.log('🔒 Security Recommendations:');
console.log('='.repeat(60) + '\n');

console.log('1. Copy the secrets above to your .env file');
console.log('2. NEVER commit .env files to git');
console.log('3. Use different secrets for each environment');
console.log('4. Rotate secrets every 90 days');
console.log('5. Store production secrets in a secure vault (AWS Secrets Manager, etc.)');
console.log('6. Enable 2FA for all admin accounts');
console.log('7. Use strong passwords (min 12 characters)');
console.log('8. Enable audit logging for sensitive operations\n');

console.log('💡 Quick setup:\n');
console.log('   # Save to .env file');
console.log('   node scripts/generate-secrets.js >> .env.new');
console.log('   # Review and merge with existing .env\n');

console.log('='.repeat(60) + '\n');

