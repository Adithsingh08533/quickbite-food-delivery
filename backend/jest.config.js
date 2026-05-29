/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@config/(.*)$':       '<rootDir>/src/config/$1',
    '^@controllers/(.*)$':  '<rootDir>/src/controllers/$1',
    '^@services/(.*)$':     '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@middleware/(.*)$':   '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$':        '<rootDir>/src/utils/$1',
    '^@types/(.*)$':        '<rootDir>/src/types/$1',
    '^@database/(.*)$':     '<rootDir>/src/database/$1',
    '^@validations/(.*)$':  '<rootDir>/src/validations/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/database/seeds/**',
    '!src/database/migrations/**',
  ],
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
