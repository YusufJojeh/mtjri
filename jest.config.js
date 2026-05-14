export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testMatch: [
    '<rootDir>/resources/js/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/resources/js/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/_temp_design_sources/',
    '/resources/js/__tests__/mocks/',
    '/resources/js/__tests__/setup/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/resources/js/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react)/)',
  ],
};
