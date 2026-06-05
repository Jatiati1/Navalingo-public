// tests/msw/handlers.js
import { rest } from "msw";

/**
 * Mock-Service-Worker request handlers.
 * Extend this list as API end-points grow.
 */
export const handlers = [
  /* ─────────────────────────────────────────────────────────
     Auth
  ───────────────────────────────────────────────────────────*/
  rest.post("/api/auth/logout", (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ ok: true })),
  ),

  /* ─────────────────────────────────────────────────────────
     Document CRUD (sample)
  ───────────────────────────────────────────────────────────*/
  rest.get("/api/documents", (_req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json([
        {
          id: "doc-1",
          title: "Hello World",
          content: "<p>Initial document</p>",
          updatedAt: Date.now(),
        },
      ]),
    ),
  ),
];
