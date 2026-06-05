// frontend/src/components/Account/sections/Subscription/hooks/useDowngradeStep3.jsx
import { useMemo, useState, useCallback } from "react";
import axiosInstance from "../../../../../api/axios.js";
import { useAuth } from "../../../../../context/AuthContext.jsx";

/**
 * Step 3 (Confirm) hook
 * - Provides keep/lose lists
 * - Handles downgrade confirmation
 * - No "Another option" column anymore
 */
export default function useDowngradeStep3({ prev, navigate }) {
  const { refreshCurrentUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const keep = useMemo(
    () => ["Essential AI for everyday tasks", "10 weekly credits"],
    [],
  );

  const lose = useMemo(
    () => [
      "25 daily credits & Precision AI",
      "600-word base & Dynamic Buffer",
      "Save up to 80 documents",
    ],
    [],
  );

  const confirm = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await axiosInstance.delete("/stripe/subscription");
      await refreshCurrentUser();
      navigate("/account/subscription", {
        replace: true,
        state: {
          toast: { severity: "success", msg: "Plan downgraded immediately." },
        },
      });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        "We couldn't complete the downgrade right now. Please try again.";
      window.alert(msg);
      setBusy(false);
    }
  }, [busy, navigate, refreshCurrentUser]);

  const keepPro = useCallback(
    () => navigate("/account/subscription"),
    [navigate],
  );

  return { keep, lose, busy, confirm, back: prev, keepPro };
}
