/**
 * Database Optimization Script
 * Analyzes and optimizes database performance
 * Run: node scripts/optimize-database.js
 */

const { sequelize } = require('../src/config/database');
const { logger } = require('../src/middleware/logger');
require('dotenv').config();

/**
 * Run VACUUM to reclaim space
 */
async function vacuumDatabase() {
  console.log('🧹 Running VACUUM...');
  try {
    await sequelize.query('VACUUM ANALYZE;');
    console.log('✅ VACUUM completed\n');
  } catch (error) {
    console.error('❌ VACUUM failed:', error.message);
  }
}

/**
 * Reindex all tables
 */
async function reindexDatabase() {
  console.log('🔄 Reindexing database...');
  try {
    await sequelize.query('REINDEX DATABASE :dbName;', {
      replacements: { dbName: process.env.DB_NAME }
    });
    console.log('✅ Reindex completed\n');
  } catch (error) {
    console.error('❌ Reindex failed:', error.message);
  }
}

/**
 * Update statistics
 */
async function updateStatistics() {
  console.log('📊 Updating table statistics...');
  try {
    await sequelize.query('ANALYZE VERBOSE;');
    console.log('✅ Statistics updated\n');
  } catch (error) {
    console.error('❌ Statistics update failed:', error.message);
  }
}

/**
 * Find slow queries
 */
async function findSlowQueries() {
  console.log('🔍 Finding slow queries...');
  try {
    const [results] = await sequelize.query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY total_exec_time DESC
      LIMIT 10;
    `);
    
    if (results.length === 0) {
      console.log('✅ No slow queries found\n');
    } else {
      console.log(`⚠️  Found ${results.length} slow queries:\n`);
      results.forEach((row, index) => {
        console.log(`${index + 1}. Query: ${row.query.substring(0, 80)}...`);
        console.log(`   Calls: ${row.calls}`);
        console.log(`   Mean Time: ${row.mean_exec_time?.toFixed(2)}ms`);
        console.log(`   Max Time: ${row.max_exec_time?.toFixed(2)}ms\n`);
      });
    }
  } catch (error) {
    console.log('⚠️  pg_stat_statements not enabled (optional)\n');
  }
}

/**
 * Check table sizes
 */
async function checkTableSizes() {
  console.log('📏 Checking table sizes...');
  try {
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
          pg_relation_size(schemaname||'.'||tablename)) AS index_size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10;
    `);
    
    console.log('\n📊 Top 10 Largest Tables:\n');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
      console.log(`   Total: ${row.total_size}`);
      console.log(`   Table: ${row.table_size}`);
      console.log(`   Indexes: ${row.index_size}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to check table sizes:', error.message);
  }
}

/**
 * Check index usage
 */
async function checkIndexUsage() {
  console.log('🔍 Checking index usage...');
  try {
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10;
    `);
    
    if (results.length === 0) {
      console.log('✅ All indexes are being used\n');
    } else {
      console.log(`⚠️  Found ${results.length} unused indexes:\n`);
      results.forEach((row, index) => {
        console.log(`${index + 1}. ${row.tablename}.${row.indexname}`);
        console.log(`   Consider removing if not needed\n`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to check indexes:', error.message);
  }
}

/**
 * Check database bloat
 */
async function checkBloat() {
  console.log('💨 Checking for table bloat...');
  try {
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_dead_tup,
        n_live_tup,
        CASE 
          WHEN n_live_tup > 0 
          THEN round(100.0 * n_dead_tup / n_live_tup, 2)
          ELSE 0 
        END AS bloat_ratio
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      AND n_dead_tup > 1000
      ORDER BY n_dead_tup DESC
      LIMIT 10;
    `);
    
    if (results.length === 0) {
      console.log('✅ No significant bloat detected\n');
    } else {
      console.log(`⚠️  Tables with bloat:\n`);
      results.forEach((row, index) => {
        console.log(`${index + 1}. ${row.tablename}`);
        console.log(`   Size: ${row.size}`);
        console.log(`   Dead tuples: ${row.n_dead_tup}`);
        console.log(`   Bloat ratio: ${row.bloat_ratio}%`);
        if (row.bloat_ratio > 10) {
          console.log(`   ⚠️  Consider VACUUM FULL on this table`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Failed to check bloat:', error.message);
  }
}

/**
 * Get database info
 */
async function getDatabaseInfo() {
  console.log('ℹ️  Database Information\n');
  try {
    // Database size
    const [[sizeResult]] = await sequelize.query(`
      SELECT pg_size_pretty(pg_database_size(:dbName)) as size;
    `, {
      replacements: { dbName: process.env.DB_NAME }
    });
    console.log(`Database Size: ${sizeResult.size}`);
    
    // Connection count
    const [[connResult]] = await sequelize.query(`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE datname = :dbName;
    `, {
      replacements: { dbName: process.env.DB_NAME }
    });
    console.log(`Active Connections: ${connResult.connections}`);
    
    // Table count
    const [[tableResult]] = await sequelize.query(`
      SELECT count(*) as tables 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log(`Total Tables: ${tableResult.tables}`);
    
    // Index count
    const [[indexResult]] = await sequelize.query(`
      SELECT count(*) as indexes 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
    console.log(`Total Indexes: ${indexResult.indexes}\n`);
    
  } catch (error) {
    console.error('❌ Failed to get database info:', error.message);
  }
}

/**
 * Main optimization routine
 */
async function optimize() {
  console.log('\n🔧 WorkOrbit Database Optimizer\n');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    // Get basic info
    await getDatabaseInfo();
    
    // Check table sizes
    await checkTableSizes();
    
    // Check for bloat
    await checkBloat();
    
    // Check index usage
    await checkIndexUsage();
    
    // Find slow queries
    await findSlowQueries();
    
    // Perform optimization
    console.log('='.repeat(50));
    console.log('🔧 OPTIMIZATION ACTIONS');
    console.log('='.repeat(50) + '\n');
    
    await updateStatistics();
    await vacuumDatabase();
    
    // Optional: Reindex (can be slow on large databases)
    console.log('💡 Reindexing is optional and can be slow.');
    console.log('   Run manually if needed: REINDEX DATABASE workorbit_db;\n');
    
    console.log('='.repeat(50));
    console.log('✅ OPTIMIZATION COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n💡 Recommendations:\n');
    console.log('1. Run this script monthly');
    console.log('2. Schedule VACUUM during low-traffic periods');
    console.log('3. Monitor slow queries and optimize them');
    console.log('4. Consider partitioning large tables (>10GB)');
    console.log('5. Review and remove unused indexes\n');
    
    logger.info('Database optimization completed');
    
  } catch (error) {
    console.error('\n❌ Optimization failed:', error);
    logger.error('Database optimization failed', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run optimization
optimize();

/**
 * USAGE:
 * 
 * Basic optimization:
 *   node scripts/optimize-database.js
 * 
 * Schedule with cron (monthly):
 *   0 3 1 * * cd /path/to/app && node scripts/optimize-database.js
 * 
 * What it does:
 * - Analyzes database structure
 * - Identifies bloated tables
 * - Finds unused indexes
 * - Discovers slow queries
 * - Runs VACUUM ANALYZE
 * - Updates statistics
 * 
 * Safe to run on production (non-blocking operations)
 */

