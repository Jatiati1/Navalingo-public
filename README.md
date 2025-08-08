Navalingo-public
Display-only snapshot of the Navalingo frontend (React + Lexical). Navalingo is an AI-assisted writing tool focused on English ↔ Spanish grammar, tone, and translation. This repo is for code review/portfolio only—no backend, keys, or runnable dev server are included.

What this shows
Editor UI (Lexical): rich-text editing, formatting, and clean insert/selection logic.

AI actions: hooks and components wired for grammar fixes, tone rewriting, and EN↔ES translation (backend endpoints abstracted).

Session-aware UX: guarded routes, optimistic UI, and error boundaries for a stable surface even when APIs fail.

Data flows: axios layer with CSRF handling + optional bearer mirror, save-on-exit (sendBeacon fallback), and debounced updates.

Structure & style: componentized layout, feature folders, and small utilities for sanitization & input safety.

What’s intentionally missing
Secrets & config (.env, certs, API keys)
Dev/build tooling (no Vite config, no scripts)

Folder map
bash
Copy
Edit
frontend/
  README.md              # This display-only note
  package.json           # Minimal metadata (no scripts)
  index.html             # App shell
  src/
    api/                 # axios instance, doc/auth helpers
    components/          # Editor + UI building blocks
    features/            # Feature-scoped views (e.g., Trash)
    pages/               # Route-level screens (if present)
    utils/               # Small shared helpers
    styles/              # Local styles/CSS modules
Notes for reviewers
Calls like /auth/*, /documents/*, etc. are mocked/plumbed via typed helpers; the actual services live in the private repo.

Security-relevant code (CSRF, session token mirroring) is visible here for review, but no credentials are present.

If you try to run it, imports referencing config will use placeholders by design.

License
AGPL-3.0 — aligns with the private project. This snapshot is for evaluation only.
