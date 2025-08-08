// frontend/src/components/Home/useDocuments.js
// Custom hook for managing document list, creation, and trash operations.

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../UI/Toast/ToastProvider";
import {
  getUserDocuments,
  createDocument,
  moveToTrash,
  restoreFromTrash,
} from "../../api/documentService";
import {
  getHomeToastFromAxiosError,
  getHomeToast,
  getSuccessToastForAction,
} from "../../utils/home/homeErrors";

const isDev = import.meta.env.DEV;

// Plan limits
const FREE_PLAN_DOC_LIMIT = 8;
const PRO_PLAN_DOC_LIMIT = 80;

/**
 * useDocuments
 * Handles fetching, creating, and managing documents in the home dashboard.
 */
export function useDocuments() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorScreen, setErrorScreen] = useState(null);

  /**
   * Fetch all documents for the current user.
   */
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorScreen(null);

    try {
      const fetched = await getUserDocuments();

      if (isDev && Array.isArray(fetched)) {
        console.table(
          fetched.map((d) => ({
            id: d.id.slice(0, 6),
            updatedAt: d.updatedAt,
          }))
        );
      }

      if (Array.isArray(fetched)) {
        setDocuments(fetched);
      } else {
        console.error("[useDocuments] Invalid API response:", fetched);
        setDocuments([]);
        setErrorScreen("Failed to load documents – invalid response.");
        showToast(getHomeToast("FETCH_LIST_FAILED").message, {
          severity: "error",
          dedupeKey: "home-fetch-error",
        });
      }
    } catch (e) {
      console.error("[useDocuments] fetchDocuments error:", e);
      setErrorScreen(e.message || "Unexpected error. Please try again.");
      const t = getHomeToastFromAxiosError(e, { action: "list" });
      showToast(t.message, {
        severity: t.severity || "error",
        dedupeKey: "home-fetch-error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /**
   * Create a new document, enforcing plan limits.
   */
  const handleCreate = useCallback(async () => {
    const isPro = currentUser?.subscriptionTier === "pro";
    const docCount = documents.length;

    // Free plan limit check
    if (!isPro && docCount >= FREE_PLAN_DOC_LIMIT) {
      const toast = getHomeToast("DOC_LIMIT_REACHED", { isPro: false });
      showToast(toast.message, {
        severity: toast.severity,
        duration: 10000,
        actionLabel: "Upgrade to Pro",
        dedupeKey: "upgrade-prompt",
        onAction: () => navigate("/account/subscription"),
      });
      return;
    }

    // Pro plan limit check
    if (isPro && docCount >= PRO_PLAN_DOC_LIMIT) {
      const toast = getHomeToast("DOC_LIMIT_REACHED", { isPro: true });
      showToast(toast.message, {
        severity: toast.severity,
        duration: 8000,
        dedupeKey: "pro-limit-prompt",
      });
      return;
    }

    try {
      const { id } = await createDocument();
      window.location.href = `/dashboard/${id}`;
    } catch (e) {
      console.error("[useDocuments] createDocument error:", e);
      const t = getHomeToastFromAxiosError(e, { action: "create" });
      showToast(t.message, {
        severity: t.severity || "error",
        dedupeKey: "doc-create-error",
      });
    }
  }, [currentUser, documents.length, showToast, navigate]);

  /**
   * Move a document to trash (optimistic UI + undo support).
   */
  const handleMoveToTrash = useCallback(
    async (docId) => {
      const originalDocs = [...documents];
      const docToTrash = originalDocs.find((d) => d.id === docId);
      if (!docToTrash) return;

      // Optimistic removal
      setDocuments((docs) => docs.filter((d) => d.id !== docId));

      try {
        await moveToTrash(docId);
        localStorage.removeItem(`rejectionList_${docId}`);

        showToast(getSuccessToastForAction("trash").message, {
          severity: "info",
          actionLabel: "Undo",
          dedupeKey: `trash-${docId}`,
          duration: 6000,
          onAction: async () => {
            setDocuments(originalDocs);
            try {
              await restoreFromTrash(docId);
            } catch (e) {
              console.error("[useDocuments] restore error:", e);
              showToast("Failed to restore document.", {
                severity: "error",
                dedupeKey: `restore-error-${docId}`,
              });
            }
          },
        });
      } catch (e) {
        console.error("[useDocuments] moveToTrash error:", e);
        setDocuments(originalDocs);
        const t = getHomeToastFromAxiosError(e, { action: "trash" });
        showToast(t.message, {
          severity: t.severity || "error",
          dedupeKey: `trash-error-${docId}`,
        });
      }
    },
    [documents, showToast]
  );

  return {
    documents,
    isLoading,
    errorScreen,
    handleCreate,
    handleMoveToTrash,
    fetchDocuments,
  };
}
