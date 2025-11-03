module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/server.js',
    '!src/config/**',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module paths
  modulePaths: ['<rootDir>/src'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js'
};

