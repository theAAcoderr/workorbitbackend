/**
 * Database Backup Script
 * Creates encrypted backups and uploads to S3
 * Run: node scripts/backup-database.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const s3Service = require('../services/s3.service');
const { logger } = require('../src/middleware/logger');
require('dotenv').config();

const BACKUP_DIR = process.env.BACKUP_PATH || './backups';
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Encrypt file using AES-256
 */
function encryptFile(inputPath, outputPath) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  
  // Write IV to beginning of file
  output.write(iv);
  
  return new Promise((resolve, reject) => {
    input.pipe(cipher).pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

/**
 * Create database backup
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `workorbit-backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  const encryptedPath = `${filepath}.enc`;
  
  console.log('🔄 Starting database backup...');
  
  try {
    // Create backup using pg_dump
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump \
      -h ${process.env.DB_HOST} \
      -p ${process.env.DB_PORT} \
      -U ${process.env.DB_USER} \
      -d ${process.env.DB_NAME} \
      -F c \
      -f ${filepath}`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Backup created: ${filename}`);
    
    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Size: ${fileSizeMB} MB`);
    
    // Encrypt backup
    if (ENCRYPTION_KEY) {
      console.log('🔐 Encrypting backup...');
      await encryptFile(filepath, encryptedPath);
      console.log('✅ Backup encrypted');
      
      // Remove unencrypted file
      fs.unlinkSync(filepath);
    }
    
    const finalPath = ENCRYPTION_KEY ? encryptedPath : filepath;
    
    // Upload to S3 if configured
    if (process.env.S3_BUCKET_NAME && s3Service.uploadFile) {
      console.log('☁️  Uploading to S3...');
      try {
        await s3Service.uploadFile(finalPath, `backups/${path.basename(finalPath)}`);
        console.log('✅ Uploaded to S3');
      } catch (error) {
        console.error('⚠️  S3 upload failed:', error.message);
      }
    }
    
    // Log backup
    logger.info('Database backup completed', {
      filename: path.basename(finalPath),
      size: fileSizeMB,
      encrypted: !!ENCRYPTION_KEY,
      uploadedToS3: !!process.env.S3_BUCKET_NAME
    });
    
    // Clean old backups
    cleanOldBackups();
    
    console.log('🎉 Backup completed successfully!');
    return finalPath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    logger.error('Database backup failed', error);
    
    // Send alert
    if (process.env.ALERT_EMAIL) {
      // TODO: Send email alert
    }
    
    throw error;
  }
}

/**
 * Decrypt and restore backup
 */
async function restoreBackup(backupPath) {
  console.log('🔄 Restoring database from backup...');
  
  try {
    let filepath = backupPath;
    
    // Decrypt if needed
    if (backupPath.endsWith('.enc')) {
      console.log('🔓 Decrypting backup...');
      const decryptedPath = backupPath.replace('.enc', '');
      
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      
      const input = fs.createReadStream(backupPath);
      const output = fs.createWriteStream(decryptedPath);
      
      // Read IV from beginning of file
      const iv = await new Promise((resolve) => {
        input.once('readable', () => {
          resolve(input.read(16));
        });
      });
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      await new Promise((resolve, reject) => {
        input.pipe(decipher).pipe(output);
        output.on('finish', resolve);
        output.on('error', reject);
      });
      
      filepath = decryptedPath;
      console.log('✅ Backup decrypted');
    }
    
    // Create safety backup before restore
    console.log('📦 Creating safety backup...');
    const safetyBackup = await createBackup();
    console.log(`✅ Safety backup created: ${safetyBackup}`);
    
    // Restore database
    console.log('🔄 Restoring database...');
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_restore \
      -h ${process.env.DB_HOST} \
      -p ${process.env.DB_PORT} \
      -U ${process.env.DB_USER} \
      -d ${process.env.DB_NAME} \
      -c \
      ${filepath}`;
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Database restored successfully!');
    logger.info('Database restored', { backupFile: backupPath });
    
    // Clean up decrypted file
    if (backupPath.endsWith('.enc') && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    logger.error('Database restore failed', error);
    throw error;
  }
}

/**
 * Clean old backups
 */
function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;
  
  files.forEach(file => {
    const filepath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filepath);
    const age = now - stats.mtimeMs;
    
    if (age > maxAge) {
      fs.unlinkSync(filepath);
      deletedCount++;
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  });
  
  if (deletedCount > 0) {
    console.log(`✅ Cleaned ${deletedCount} old backup(s)`);
  }
}

/**
 * List available backups
 */
function listBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const backups = files
    .filter(f => f.startsWith('workorbit-backup-'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filepath);
      return {
        filename: f,
        size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        created: stats.mtime,
        age: Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24)) + ' days'
      };
    })
    .sort((a, b) => b.created - a.created);
  
  console.log('\n📋 Available Backups:\n');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.filename}`);
    console.log(`   Size: ${backup.size}`);
    console.log(`   Age: ${backup.age}`);
    console.log(`   Created: ${backup.created.toISOString()}\n`);
  });
  
  return backups;
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

(async () => {
  try {
    switch (command) {
      case 'create':
        await createBackup();
        break;
      
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
      
      case 'list':
        listBackups();
        break;
      
      case 'clean':
        cleanOldBackups();
        break;
      
      default:
        console.log(`
Usage: node scripts/backup-database.js <command>

Commands:
  create              Create new backup
  restore <file>      Restore from backup
  list                List available backups
  clean               Remove old backups

Examples:
  node scripts/backup-database.js create
  node scripts/backup-database.js restore backups/workorbit-backup-2025-10-19.sql.enc
  node scripts/backup-database.js list
  node scripts/backup-database.js clean
        `);
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
})();

module.exports = { createBackup, restoreBackup, listBackups, cleanOldBackups };

