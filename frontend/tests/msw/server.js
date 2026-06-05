// tests/msw/server.js
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * One MSW instance for the whole Jest runtime.
 * jest.setup.js starts / resets / closes it automatically.
 */
export const server = setupServer(...handlers);
