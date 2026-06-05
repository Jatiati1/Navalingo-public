/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",

  // Points to your global setup file.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Use babel-jest for transforming JS/JSX files.
  // This will pick up your babel.config.js.
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  // Keep transformIgnorePatterns if you have specific needs, otherwise Jest's default is often fine.
  // Default: '/node_modules/' except for known ESM packages if you configure experimental ESM support.
  transformIgnorePatterns: [
    "/node_modules/",
    "\\.pnp\\.[^\\/]+$", // Common exclusion for Yarn PnP
  ],

  // Module name mapper for aliases and mocks.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^.+\\.module\\.(css|s[ac]ss)$": "identity-obj-proxy",
    "^.+\\.(css|s[ac]ss)$": "<rootDir>/tests/_mocks_/styleMock.js",
    "^.+\\.(png|jpe?g|gif|svg)$": "<rootDir>/tests/_mocks_/fileMock.js",
  },

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "babel", // Recommended when using babel-jest
  coverageReporters: ["text-summary", "lcov", "html"],

  reporters: ["default"],

  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,

  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
};
