/**
 * Jest Configuration
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  // Use Node.js environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],

  // Test match patterns
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Coverage thresholds (optional)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ]
};

