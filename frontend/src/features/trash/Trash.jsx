// src/features/trash/Trash.jsx
// Lists trashed docs and lets the user restore, permanently delete, or empty trash.
// Uses global toasts for feedback; keeps a minimal inline error for persistence.

import { useState, useEffect, useCallback } from "react";
import {
  getTrashedDocuments,
  restoreFromTrash,
  permanentlyDeleteDocument,
  emptyTrash,
} from "../../api/documentService";
import DocumentCard from "../../components/Home/components/DocumentCard/DocumentCard.jsx";
import { useToast } from "../../components/UI/Toast/ToastProvider.jsx";
import styles from "./Trash.module.css";

// Dev-only logs
const isDev = import.meta.env.DEV;
const log = (...a) =>
  isDev && console.info("%c[TrashUI]", "color:#C0392B", ...a);

export default function GlobalTrashComponent() {
  const { showToast } = useToast();

  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    log("Refreshing trashed documents…");
    setBusy(true);
    try {
      const fetched = await getTrashedDocuments();
      setDocs(Array.isArray(fetched) ? fetched : []);
      setError(null);
      log(`Found ${Array.isArray(fetched) ? fetched.length : 0} items.`);
    } catch (err) {
      console.error("Error loading trash:", err);
      setError("Failed to load trashed documents. Please try again.");
      showToast("Failed to load trashed documents.", {
        severity: "error",
        dedupeKey: "trash-load-fail",
      });
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = async (id) => {
    log("RESTORE", id);
    try {
      await restoreFromTrash(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setError(null);
      showToast("Document restored.", {
        severity: "success",
        duration: 2600,
        dedupeKey: `restore-${id}`,
      });
    } catch (err) {
      console.error("Error restoring doc:", err);
      setError("Failed to restore document. Please try again.");
      showToast("Restore failed.", {
        severity: "error",
        dedupeKey: `restore-fail-${id}`,
      });
    }
  };

  const hardDelete = async (id) => {
    log("DELETE FOREVER", id);
    const ok = window.confirm(
      "This document will be permanently deleted. This action cannot be undone. Continue?"
    );
    if (!ok) {
      showToast("Deletion cancelled.", {
        severity: "info",
        duration: 1800,
        dedupeKey: `delete-cancel-${id}`,
      });
      return;
    }
    try {
      await permanentlyDeleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setError(null);
      showToast("Document permanently deleted.", {
        severity: "success",
        duration: 2800,
        dedupeKey: `delete-${id}`,
      });
    } catch (err) {
      console.error("Error deleting doc:", err);
      setError("Failed to permanently delete document. Please try again.");
      showToast("Permanent delete failed.", {
        severity: "error",
        dedupeKey: `delete-fail-${id}`,
      });
    }
  };

  const clearTrash = async () => {
    if (docs.length === 0) {
      showToast("Trash is already empty.", {
        severity: "info",
        duration: 2200,
        dedupeKey: "empty-trash-already",
      });
      return;
    }
    const ok = window.confirm(
      `Permanently delete all ${docs.length} items in your trash? This action cannot be undone.`
    );
    if (!ok) {
      showToast("Empty trash cancelled.", {
        severity: "info",
        duration: 2000,
        dedupeKey: "empty-cancel",
      });
      return;
    }
    setBusy(true);
    try {
      await emptyTrash();
      setDocs([]);
      setError(null);
      showToast("Trash emptied.", {
        severity: "success",
        duration: 2800,
        dedupeKey: "empty-trash-success",
      });
    } catch (err) {
      console.error("Error emptying trash:", err);
      setError("Failed to empty trash. Please try again.");
      showToast("Empty trash failed.", {
        severity: "error",
        dedupeKey: "empty-trash-fail",
      });
    } finally {
      setBusy(false);
    }
  };

  // Render
  let body = null;

  if (busy && docs.length === 0) {
    body = (
      <div className={styles.loadingContainer} role="status" aria-live="polite">
        <div className={styles.loader} />
      </div>
    );
  } else if (docs.length === 0 && !error) {
    body = (
      <div className={styles.emptyState}>
        <svg
          className={styles.emptyIcon}
          viewBox="0 0 24 24"
          width="64"
          height="64"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
        <h3>Your trash is empty</h3>
        <p>
          Items you move to trash will appear here for 30 days before being
          permanently deleted.
        </p>
      </div>
    );
  } else {
    body = (
      <div className={styles.trashGrid}>
        {docs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            actions={
              <>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.restoreButton}`}
                  onClick={() => restore(doc.id)}
                  disabled={busy}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => hardDelete(doc.id)}
                  disabled={busy}
                >
                  Delete Forever
                </button>
              </>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.trashContainerRoot} aria-busy={busy}>
      <header className={styles.trashHeader}>
        <div className={styles.headerControls}>
          <p className={styles.trashInfo}>
            Items in the trash are permanently deleted after 30 days.
          </p>
          <button
            type="button"
            className={styles.emptyTrashButton}
            onClick={clearTrash}
            disabled={docs.length === 0 || busy}
          >
            {busy && docs.length > 0 ? "Processing..." : "Empty Trash Now"}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.errorMessage} role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {body}

      {/* SR-only live region for status updates */}
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          border: 0,
        }}
      >
        {busy ? "Working…" : ""}
      </div>
    </div>
  );
}
