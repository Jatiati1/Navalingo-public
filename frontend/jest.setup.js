/* ------------------------------------------------------------------ */
/* Global Jest setup – runs before every test                         */
/* ------------------------------------------------------------------ */

// Define Vite environment variables for Jest via process.env
// This MUST be at the top to ensure it's set before babel-plugin-transform-define tries to use it.
process.env.JEST_VITE_API_BASE_URL = "http://localhost:3001/api/jest-mock-url";

// Assuming your msw server setup is in 'tests/msw/server.js' relative to the frontend root.
// If jest.setup.js is at <rootDir>/jest.setup.js, and server.js is at <rootDir>/tests/msw/server.js:
import { server } from "./tests/msw/server.js";
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

/* ────── MSW life-cycle hooks ─────────────────────────────────────── */
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

afterAll(() => server.close());

/* ────── Suppress React 18 act(...) warnings in Jest ──────────────── */
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("was not wrapped in act(...)")
  ) {
    return;
  }
  originalError.call(console, ...args);
};
