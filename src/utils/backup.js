const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../middleware/logger');
const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Create database backup
   */
  async createBackup(options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      const {
        DB_HOST = 'localhost',
        DB_PORT = 5432,
        DB_NAME,
        DB_USER,
        DB_PASSWORD
      } = process.env;

      if (!DB_NAME || !DB_USER) {
        throw new Error('Database credentials not configured');
      }

      // PostgreSQL backup command
      const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F c -b -v -f "${filepath}"`;

      await execAsync(command);

      // Compress backup if requested
      if (options.compress) {
        const gzipCommand = `gzip "${filepath}"`;
        await execAsync(gzipCommand);
        filepath = `${filepath}.gz`;
        filename = `${filename}.gz`;
      }

      const stats = await fs.stat(filepath);

      logger.info('Database backup created', {
        filename,
        size: stats.size,
        path: filepath
      });

      return {
        success: true,
        filename,
        filepath,
        size: stats.size,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);

      // Check if file exists
      await fs.access(filepath);

      const {
        DB_HOST = 'localhost',
        DB_PORT = 5432,
        DB_NAME,
        DB_USER,
        DB_PASSWORD
      } = process.env;

      // Decompress if needed
      if (filename.endsWith('.gz')) {
        const gunzipCommand = `gunzip -k "${filepath}"`;
        await execAsync(gunzipCommand);
        filepath = filepath.replace('.gz', '');
      }

      // PostgreSQL restore command
      const command = `PGPASSWORD="${DB_PASSWORD}" pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c -v "${filepath}"`;

      await execAsync(command);

      logger.info('Database restored successfully', { filename });

      return {
        success: true,
        message: 'Database restored successfully',
        filename,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * List all backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.gz'))) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);

          backups.push({
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return {
        success: true,
        count: backups.length,
        backups
      };
    } catch (error) {
      logger.error('List backups failed:', error);
      throw error;
    }
  }

  /**
   * Delete old backups
   */
  async cleanupOldBackups(maxAgeHours = 168) { // 7 days default
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('backup-')) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);

          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filepath);
            deletedCount++;
            logger.info('Old backup deleted', { file });
          }
        }
      }

      return {
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} old backup(s)`
      };
    } catch (error) {
      logger.error('Cleanup backups failed:', error);
      throw error;
    }
  }

  /**
   * Delete specific backup
   */
  async deleteBackup(filename) {
    try {
      const filepath = path.join(this.backupDir, filename);
      await fs.unlink(filepath);

      logger.info('Backup deleted', { filename });

      return {
        success: true,
        message: 'Backup deleted successfully',
        filename
      };
    } catch (error) {
      logger.error('Delete backup failed:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   */
  scheduleBackups(cronExpression = '0 2 * * *') { // Daily at 2 AM
    const cron = require('node-cron');

    cron.schedule(cronExpression, async () => {
      logger.info('Starting scheduled backup...');
      try {
        await this.createBackup({ compress: true });
        await this.cleanupOldBackups(168); // Keep last 7 days
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    });

    logger.info('Backup schedule configured', { cronExpression });
  }
}

module.exports = new BackupService();
