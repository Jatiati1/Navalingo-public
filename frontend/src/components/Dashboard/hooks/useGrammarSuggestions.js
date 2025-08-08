// frontend/src/components/Dashboard/hooks/useGrammarSuggestions.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../UI/Toast";
import {
  getEditorToast,
  getEditorToastFromError,
} from "../../../utils/editor/dashboardErrors.js";

/** POST helper with session and CSRF headers. Retries once on 401. */
const postWithSessionToken = async (body, csrfToken) => {
  const send = async () => {
    const sess = localStorage.getItem("session_token");
    return fetch("/api/process-text", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess}`,
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(body),
    });
  };
  let res = await send();
  if (res.status === 401) res = await send();
  return res;
};

/**
 * Grammar suggestions state and actions.
 * Persists per-document rejections in localStorage.
 */
export function useGrammarSuggestions(editorRef, docId) {
  const { csrfToken } = useAuth();
  const { showToast } = useToast();

  const [suggestions, setSuggestions] = useState([]);
  const [rejectionList, setRejectionList] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(`rejectionList_${docId}`);
    if (!raw) {
      setRejectionList([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setRejectionList(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(`rejectionList_${docId}`);
      setRejectionList([]);
    }
  }, [docId]);

  const rejectSuggestion = useCallback(
    (sugg) => {
      const key = `${sugg.start}-${sugg.end}`;
      const next = [...rejectionList, key];
      setRejectionList(next);
      localStorage.setItem(`rejectionList_${docId}`, JSON.stringify(next));
    },
    [rejectionList, docId]
  );

  const runCheck = useCallback(
    async (text, cap) => {
      setSuggestions([]);
      try {
        const response = await postWithSessionToken(
          {
            text,
            action: "correct-live",
            maxWords: cap,
            extra: { rejectionList },
          },
          csrfToken
        );

        const result = await response.json();
        if (!response.ok) {
          // Preserve backend error shape for centralized handling.
          throw { response: { data: result } };
        }

        const finalSuggestions = result.edits || [];
        setSuggestions(finalSuggestions);

        // Only announce when nothing was found; otherwise the panel is feedback enough.
        if (finalSuggestions.length === 0) {
          const { message, severity } = getEditorToast("NO_ISSUES_FOUND");
          showToast(message, { severity });
        }
      } catch (err) {
        const { message, severity } = getEditorToastFromError(err, {
          action: "correct",
        });
        showToast(message, { severity });
      }
    },
    [editorRef, csrfToken, rejectionList, showToast]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, rejectSuggestion, runCheck, clearSuggestions };
}
