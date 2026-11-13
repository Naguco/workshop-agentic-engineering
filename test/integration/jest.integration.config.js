// Jest config for live integration tests only.
// Selected explicitly by `npm run integration-test`; kept separate from the
// default unit-test config in package.json so `npm test` stays offline/fast.
module.exports = {
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/test/integration/**/*.integration.test.js'],
  // Live external calls (SuccessFactors, AI Core) need headroom beyond Jest's 5s default.
  testTimeout: 60000,
};
