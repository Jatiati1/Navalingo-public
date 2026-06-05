// frontend/src/components/Account/sections/Subscription/hooks/useDowngradeStep1.jsx
import React, { useMemo, useCallback } from "react";

export default function useDowngradeStep1({ currentUser, go, navigate }) {
  // Reset window text (e.g., "6d 22h")
  const resetText = useMemo(() => {
    const iso = currentUser?.credits?.resets;
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return "now";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return `${d}d ${h}h`;
  }, [currentUser?.credits?.resets]);

  // Actions
  const onKeepPro = useCallback(
    () => navigate("/account/subscription"),
    [navigate],
  );
  const onContinue = useCallback(() => go(2), [go]);

  // Lists for Step 1 (titles only, no tips)
  const losses = useMemo(
    () => [
      { title: "Credit drop to 10 per week" },
      { title: "Base word count goes from 600 → 200" },
      { title: "Precision AI & Dynamic Buffer disabled" },
      { title: "Document limit: 80 → 8" },
    ],
    [],
  );

  const benefits = useMemo(
    () => [
      {
        title: "25 Daily Credits",
        tip: "More than five times the power for busy weeks.",
      },
      {
        title: "600-word base & smart buffer",
        tip: "Safer long-form results without cut-offs.",
      },
      {
        title: "Precision AI engine",
        tip: "Higher accuracy on critical edits.",
      },
    ],
    [],
  );

  return { losses, benefits, resetText, onKeepPro, onContinue };
}
