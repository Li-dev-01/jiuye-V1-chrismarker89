export default {
  "testEnvironment": "node",
  "testMatch": [
    "**/tests/api/**/*.test.js"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/tests/api/setup.js"
  ],
  "collectCoverageFrom": [
    "backend/src/**/*.{js,ts}",
    "!backend/src/**/*.d.ts",
    "!backend/src/**/*.test.{js,ts}"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "testTimeout": 30000,
  "extensionsToTreatAsEsm": [".js"],
  "globals": {
    "__DEV__": true
  },
  "transform": {}
};