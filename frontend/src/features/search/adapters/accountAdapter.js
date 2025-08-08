// src/features/search/adapters/accountAdapter.js
// Account search adapter with static pages and dynamic “quick” items for the
// current user's email, phone, and password.
// Result shape consumed by SearchBar: { id, label, action, section?, sub? }

import Fuse from "fuse.js";

// Static account pages (extend as needed)
const BASE_PAGES = [
  {
    id: "profile",
    label: "Profile",
    path: "/account",
    section: "Profile & Identity",
  },
  {
    id: "security",
    label: "Security",
    path: "/account/security",
    section: "Profile & Identity",
  },

  {
    id: "subscription",
    label: "Subscription",
    path: "/account/subscription",
    section: "Management",
  },
  {
    id: "feedback",
    label: "Feedback",
    path: "/account/feedback",
    section: "Management",
  },

  {
    id: "trash",
    label: "Trash",
    path: "/account/trash",
    section: "Data & Cleanup",
  },
];

// Fuse over static pages only
function createFuse() {
  return new Fuse(BASE_PAGES, {
    keys: ["label", "section"],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

/**
 * Factory: pass a getter returning the current user (e.g., () => authUser).
 * Keeps results fresh if the user updates email/phone during the session.
 */
export function makeAccountAdapter(getUser) {
  const fuse = createFuse();

  return {
    /**
     * @param {string} term
     * @returns {Array<{id:string,label:string,action:Function,section?:string,sub?:string}>}
     */
    search(term) {
      const q = term.trim();
      if (!q) return [];

      const qLower = q.toLowerCase();
      const user = getUser ? getUser() : null;

      // Build dynamic quick items (no section → they render above grouped pages)
      const quick = [];

      if (user?.email) {
        quick.push({
          id: "email_field",
          label: "Email address",
          sub: user.email,
          action: () => (window.location.href = "/account/security"),
        });
      }

      if (user?.phoneNumber) {
        quick.push({
          id: "phone_field",
          label: "Phone number",
          sub: user.phoneNumber,
          action: () => (window.location.href = "/account/security"),
        });
      }

      const isPasswordUser = user?.providerData?.some(
        (p) => p.providerId === "password"
      );
      if (isPasswordUser) {
        quick.push({
          id: "password_field",
          label: "Password",
          sub: "********",
          action: () => (window.location.href = "/account/security"),
        });
      }

      // Simple substring filter for quick items (label + sub)
      const quickMatches = quick.filter((item) => {
        const hay = (item.label + " " + (item.sub || "")).toLowerCase();
        return hay.includes(qLower);
      });

      // Static pages via Fuse
      const pageMatches = fuse
        .search(q)
        .slice(0, 25)
        .map((m) => {
          const it = m.item;
          return {
            id: it.id,
            label: it.label,
            section: it.section,
            action: () => (window.location.href = it.path),
          };
        });

      // Quick items first (ungrouped), then grouped static pages
      return [...quickMatches, ...pageMatches];
    },
  };
}
