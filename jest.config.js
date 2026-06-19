module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$':
      'jest-transform-stub',
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)',
    '**/__tests__/*.(js|jsx|ts|tsx)',
    '**/src/**/*.spec.(js|jsx|ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/router/index.js',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
