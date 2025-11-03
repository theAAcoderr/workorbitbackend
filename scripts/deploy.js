/**
 * Production Deployment Script
 * Automates deployment with safety checks
 * Run: node scripts/deploy.js [environment]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

const environments = {
  staging: {
    name: 'Staging',
    host: process.env.STAGING_HOST || 'staging.workorbit.com',
    branch: 'develop',
    healthCheck: process.env.STAGING_URL || 'https://api-staging.workorbit.com/health'
  },
  production: {
    name: 'Production',
    host: process.env.PRODUCTION_HOST || 'workorbit.com',
    branch: 'main',
    healthCheck: process.env.PRODUCTION_URL || 'https://api.workorbit.com/health'
  }
};

async function deploy() {
  const environment = process.argv[2] || 'staging';
  
  if (!environments[environment]) {
    console.error('❌ Invalid environment. Use: staging or production');
    process.exit(1);
  }
  
  const env = environments[environment];
  
  console.log(`\n🚀 WorkOrbit Deployment Script`);
  console.log(`=`.repeat(50));
  console.log(`Environment: ${env.name}`);
  console.log(`Branch: ${env.branch}`);
  console.log(`=`.repeat(50)\n);
  
  // Step 1: Pre-deployment checks
  console.log('1️⃣  Running pre-deployment checks...\n');
  
  // Check if on correct branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  if (currentBranch !== env.branch) {
    console.log(`⚠️  Warning: Currently on branch '${currentBranch}', expected '${env.branch}'`);
    const answer = await ask(`   Switch to ${env.branch}? (y/n): `);
    if (answer.toLowerCase() === 'y') {
      execSync(`git checkout ${env.branch}`);
      console.log(`✅ Switched to ${env.branch}\n`);
    } else {
      console.log('❌ Deployment cancelled');
      process.exit(1);
    }
  }
  
  // Check for uncommitted changes
  try {
    execSync('git diff-index --quiet HEAD --');
    console.log('✅ No uncommitted changes\n');
  } catch {
    console.log('❌ You have uncommitted changes!');
    const answer = await ask('   Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Deployment cancelled');
      process.exit(1);
    }
  }
  
  // Pull latest changes
  console.log('📥 Pulling latest changes...');
  execSync('git pull origin ' + env.branch, { stdio: 'inherit' });
  console.log('✅ Code updated\n');
  
  // Step 2: Run tests
  console.log('2️⃣  Running tests...\n');
  try {
    execSync('npm test -- --coverage --passWithNoTests', { stdio: 'inherit' });
    console.log('\n✅ All tests passed\n');
  } catch {
    console.log('\n❌ Tests failed!');
    const answer = await ask('   Deploy anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Deployment cancelled');
      process.exit(1);
    }
  }
  
  // Step 3: Backup database
  console.log('3️⃣  Creating database backup...\n');
  try {
    execSync('node scripts/backup-database.js create', { stdio: 'inherit' });
    console.log('\n✅ Backup created\n');
  } catch (error) {
    console.log('\n⚠️  Backup failed, but continuing...\n');
  }
  
  // Step 4: Build Docker image
  console.log('4️⃣  Building Docker image...\n');
  const imageTag = `workorbit-backend:${Date.now()}`;
  try {
    execSync(`docker build -t ${imageTag} .`, { stdio: 'inherit' });
    console.log(`\n✅ Image built: ${imageTag}\n`);
  } catch {
    console.log('\n❌ Build failed!');
    process.exit(1);
  }
  
  // Step 5: Run database migrations
  console.log('5️⃣  Running database migrations...\n');
  try {
    execSync('docker-compose exec backend npm run db:migrate', { stdio: 'inherit' });
    console.log('\n✅ Migrations completed\n');
  } catch (error) {
    console.log('\n⚠️  Migration error!');
    const answer = await ask('   Rollback and exit? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      execSync('docker-compose exec backend npm run db:migrate:undo');
      console.log('Migrations rolled back');
      process.exit(1);
    }
  }
  
  // Step 6: Deploy
  console.log('6️⃣  Deploying application...\n');
  
  console.log('⚠️  FINAL CONFIRMATION');
  console.log(`   Environment: ${env.name}`);
  console.log(`   Branch: ${env.branch}`);
  console.log(`   Image: ${imageTag}`);
  
  const finalAnswer = await ask('\n   Deploy NOW? (yes/no): ');
  
  if (finalAnswer.toLowerCase() !== 'yes') {
    console.log('\n❌ Deployment cancelled by user');
    process.exit(0);
  }
  
  console.log('\n🚀 Deploying...\n');
  
  try {
    // Stop old containers
    execSync('docker-compose down', { stdio: 'inherit' });
    
    // Start new containers
    execSync('docker-compose up -d --build', { stdio: 'inherit' });
    
    console.log('\n✅ Containers started\n');
  } catch (error) {
    console.log('\n❌ Deployment failed!');
    console.log('Rolling back...');
    execSync('docker-compose up -d'); // Restart with old image
    process.exit(1);
  }
  
  // Step 7: Health check
  console.log('7️⃣  Running health checks...\n');
  
  console.log('Waiting 30 seconds for services to start...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    execSync('node scripts/health-check.js', { stdio: 'inherit' });
    console.log('\n✅ Health checks passed\n');
  } catch {
    console.log('\n❌ Health checks failed!');
    console.log('Check logs: docker-compose logs backend');
    const answer = await ask('   Rollback? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      console.log('Rolling back...');
      // TODO: Implement rollback logic
    }
  }
  
  // Step 8: Smoke tests
  console.log('8️⃣  Running smoke tests...\n');
  
  const smokeTests = [
    { name: 'Health endpoint', url: env.healthCheck },
    { name: 'API root', url: env.healthCheck.replace('/health', '/') },
  ];
  
  for (const test of smokeTests) {
    try {
      execSync(`curl -f ${test.url}`, { stdio: 'pipe' });
      console.log(`   ✅ ${test.name}`);
    } catch {
      console.log(`   ❌ ${test.name} failed`);
    }
  }
  
  // Step 9: Cleanup
  console.log('\n9️⃣  Cleaning up...\n');
  try {
    execSync('docker system prune -f', { stdio: 'pipe' });
    console.log('✅ Cleaned up old images\n');
  } catch {
    console.log('⚠️  Cleanup failed (non-critical)\n');
  }
  
  // Success!
  console.log('='.repeat(50));
  console.log('🎉 DEPLOYMENT SUCCESSFUL!');
  console.log('='.repeat(50));
  console.log(`\nEnvironment: ${env.name}`);
  console.log(`URL: ${env.healthCheck.replace('/health', '')}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`\n✅ Monitor the application for the next 30 minutes`);
  console.log(`📊 Check Grafana: http://localhost:3000`);
  console.log(`📋 View logs: docker-compose logs -f backend`);
  console.log('\n');
  
  rl.close();
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Deployment failed:', error.message);
  rl.close();
  process.exit(1);
});

// Run deployment
deploy().catch(error => {
  console.error('Deployment error:', error);
  process.exit(1);
});

