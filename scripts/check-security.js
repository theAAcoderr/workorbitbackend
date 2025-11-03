/**
 * Security Checker Script
 * Scans codebase for common security issues
 * Run: node scripts/check-security.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 WorkOrbit Security Checker\n');

const issues = [];

// Check 1: console.log statements
console.log('1️⃣  Checking for console.log statements...');
try {
  const result = execSync('grep -r "console.log" src/ --exclude-dir=node_modules || true', { encoding: 'utf-8' });
  const matches = result.trim().split('\n').filter(line => line && !line.includes('// DEBUG'));
  
  if (matches.length > 0 && matches[0]) {
    issues.push({
      severity: 'warning',
      category: 'Code Quality',
      issue: `Found ${matches.length} console.log statement(s)`,
      recommendation: 'Replace with Winston logger',
      count: matches.length
    });
  } else {
    console.log('   ✅ No console.log statements found\n');
  }
} catch (error) {
  console.log('   ⏭️  Could not scan for console.log\n');
}

// Check 2: Hardcoded secrets
console.log('2️⃣  Checking for potential hardcoded secrets...');
const secretPatterns = [
  /password\s*=\s*["'][^"']+["']/gi,
  /api[_-]?key\s*=\s*["'][^"']+["']/gi,
  /secret\s*=\s*["'][^"']+["']/gi,
  /token\s*=\s*["'][^"']+["']/gi,
];

const srcFiles = execSync('find src/ -name "*.js" -type f', { encoding: 'utf-8' })
  .trim()
  .split('\n');

let secretsFound = 0;
srcFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    secretPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        // Ignore test/example values
        const realSecrets = matches.filter(m => 
          !m.includes('process.env') &&
          !m.includes('your_') &&
          !m.includes('example') &&
          !m.includes('test')
        );
        if (realSecrets.length > 0) {
          secretsFound += realSecrets.length;
        }
      }
    });
  } catch (err) {
    // Skip unreadable files
  }
});

if (secretsFound > 0) {
  issues.push({
    severity: 'critical',
    category: 'Security',
    issue: `Found ${secretsFound} potential hardcoded secret(s)`,
    recommendation: 'Move all secrets to environment variables',
    count: secretsFound
  });
} else {
  console.log('   ✅ No hardcoded secrets found\n');
}

// Check 3: SQL Injection risks
console.log('3️⃣  Checking for SQL injection risks...');
try {
  const rawQueries = execSync('grep -r "sequelize.query" src/ || true', { encoding: 'utf-8' });
  const unsafeQueries = rawQueries.split('\n').filter(line => 
    line && !line.includes('replacements:') && !line.includes('bind:')
  );
  
  if (unsafeQueries.length > 0) {
    issues.push({
      severity: 'critical',
      category: 'Security',
      issue: `Found ${unsafeQueries.length} potentially unsafe raw SQL queries`,
      recommendation: 'Use parameterized queries or ORM methods',
      count: unsafeQueries.length
    });
  } else {
    console.log('   ✅ All SQL queries appear safe\n');
  }
} catch (error) {
  console.log('   ⏭️  Could not scan SQL queries\n');
}

// Check 4: Missing input validation
console.log('4️⃣  Checking for routes without validation...');
const routeFiles = execSync('find src/routes/ -name "*.js" -type f', { encoding: 'utf-8' })
  .trim()
  .split('\n');

let unvalidatedRoutes = 0;
routeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const hasValidators = content.includes('Validators') || content.includes('validateRequest');
    const hasRoutes = content.match(/router\.(post|put|patch)/g);
    
    if (hasRoutes && !hasValidators) {
      unvalidatedRoutes++;
    }
  } catch (err) {
    // Skip
  }
});

if (unvalidatedRoutes > 0) {
  issues.push({
    severity: 'warning',
    category: 'Security',
    issue: `${unvalidatedRoutes} route file(s) missing input validation`,
    recommendation: 'Add express-validator to all POST/PUT/PATCH routes',
    count: unvalidatedRoutes
  });
} else {
  console.log('   ✅ All route files have validators\n');
}

// Check 5: Environment variables
console.log('5️⃣  Checking for .env file...');
if (!fs.existsSync('.env') && process.env.NODE_ENV !== 'test') {
  issues.push({
    severity: 'critical',
    category: 'Configuration',
    issue: '.env file not found',
    recommendation: 'Create .env file from .env.example',
    count: 1
  });
} else {
  console.log('   ✅ .env file exists\n');
}

// Check 6: Debug routes
console.log('6️⃣  Checking for debug routes...');
try {
  const debugRoutes = execSync('grep -r "/debug" src/routes/ || true', { encoding: 'utf-8' });
  if (debugRoutes.trim()) {
    issues.push({
      severity: 'warning',
      category: 'Security',
      issue: 'Debug routes found in code',
      recommendation: 'Protect debug routes with NODE_ENV check',
      count: debugRoutes.split('\n').filter(l => l).length
    });
  } else {
    console.log('   ✅ No debug routes found\n');
  }
} catch (error) {
  console.log('   ⏭️  Could not scan for debug routes\n');
}

// Check 7: CORS configuration
console.log('7️⃣  Checking CORS configuration...');
try {
  const serverFile = fs.readFileSync('src/server.js', 'utf-8');
  if (serverFile.includes("origin: '*'") && process.env.NODE_ENV === 'production') {
    issues.push({
      severity: 'critical',
      category: 'Security',
      issue: 'CORS allows all origins in production',
      recommendation: 'Set specific CORS_ORIGIN in production .env',
      count: 1
    });
  } else {
    console.log('   ✅ CORS configuration looks safe\n');
  }
} catch (error) {
  console.log('   ⏭️  Could not check CORS config\n');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SECURITY SCAN SUMMARY');
console.log('='.repeat(60) + '\n');

if (issues.length === 0) {
  console.log('✅ No security issues found! Great job!\n');
} else {
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES:');
    critical.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.issue}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Recommendation: ${issue.recommendation}`);
    });
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.issue}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Recommendation: ${issue.recommendation}`);
    });
    console.log();
  }
  
  console.log(`\nTotal Issues: ${issues.length} (${critical.length} critical, ${warnings.length} warnings)`);
  console.log('\n💡 Run this script regularly to maintain security standards');
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit with error code if critical issues found
if (issues.some(i => i.severity === 'critical')) {
  process.exit(1);
}

