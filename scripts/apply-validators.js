/**
 * Script to help apply validators to existing routes
 * Run: node scripts/apply-validators.js
 */

const fs = require('fs');
const path = require('path');

const routeFiles = [
  'src/routes/authRoutes.js',
  'src/routes/attendanceRoutes.js',
  'src/routes/employeeRoutes.js',
  'src/routes/leaveRoutes.js',
  'src/routes/payrollRoutes.js',
  // Add more route files as needed
];

const validatorExamples = {
  POST: {
    '/register': 'registerValidators',
    '/login': 'loginValidators',
    '/checkin': 'checkInValidators',
    '/checkout': 'checkOutValidators',
  },
  PUT: {
    '/:id': 'updateValidators',
  },
  GET: {
    '/': 'paginationValidators',
    '/:id': 'uuidValidator',
  },
};

console.log('🔍 Scanning route files for missing validators...\n');

routeFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${file} (file not found)`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📄 Checking ${file}:`);
  
  let needsValidation = [];
  
  lines.forEach((line, index) => {
    // Check for route definitions without validators
    if (line.match(/router\.(post|put|patch|delete|get)\(/)) {
      const hasValidator = content.includes('Validators') || content.includes('validateRequest');
      
      if (!hasValidator && line.includes('authMiddleware')) {
        needsValidation.push({
          line: index + 1,
          code: line.trim(),
        });
      }
    }
  });
  
  if (needsValidation.length === 0) {
    console.log('  ✅ All routes have validators or don\'t need them\n');
  } else {
    console.log(`  ⚠️  Found ${needsValidation.length} route(s) that might need validators:`);
    needsValidation.forEach(route => {
      console.log(`     Line ${route.line}: ${route.code}`);
    });
    console.log();
  }
});

console.log('\n📝 Example of adding validators:');
console.log(`
// Before:
router.post('/api/v1/employees', authMiddleware, employeeController.createEmployee);

// After:
const { createEmployeeValidators } = require('../middleware/validators/employeeValidators');

router.post(
  '/api/v1/employees',
  authMiddleware,
  authorizeRoles('admin', 'hr'),
  createEmployeeValidators,
  employeeController.createEmployee
);
`);

console.log('\n✅ Scan complete!');
console.log('💡 See PRACTICAL_EXAMPLES_GUIDE.md for more examples\n');

