export default {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['**/test/unit/**/*.test.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['**/test/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/test/integration/jest.setup.js'],
    },
  ],
};
