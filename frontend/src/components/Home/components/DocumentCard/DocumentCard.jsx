// frontend/src/components/Home/components/DocumentCard/DocumentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DocumentCard.module.css";
import { getTextFromLexicalJSON } from "../../../../utils/editor/lexicalConfig.js";
import Tooltip from "../../../UI/Tooltip/Tooltip.jsx";

const DOCUMENT_CARD_TITLE_WORD_LIMIT = 12;

const DocumentCard = ({ document, onDelete, onOpen, actions, isOnline }) => {
  const navigate = useNavigate();
  const { id, title, content, updatedAt } = document;

  /* Navigation */
  const handleClick = () => {
    if (onOpen) onOpen(id);
    else if (!actions) navigate(`/dashboard/${id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  /* Utilities */
  const formatDate = (timestamp) => {
    const date = (() => {
      if (!timestamp) return null;
      if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
      if (typeof timestamp === "string") return new Date(timestamp); // ISO
      if (typeof timestamp === "number") return new Date(timestamp); // epoch ms
      if ("_seconds" in timestamp) return new Date(timestamp._seconds * 1e3);
      return null;
    })();

    if (!(date instanceof Date) || isNaN(date)) {
      const today = new Date();
      return today.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    }

    const opts = { day: "numeric", month: "short" };
    if (date.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return date.toLocaleDateString("en-US", opts);
  };

  const createPreview = (jsonContent) => {
    if (!jsonContent) return "";
    const plainText = getTextFromLexicalJSON(jsonContent);
    return plainText.length > 120 ? `${plainText.slice(0, 120)}…` : plainText;
  };

  const formatCardTitle = (originalTitle) => {
    const defaultTitle = "Untitled Document";
    if (!originalTitle?.trim()) return defaultTitle;

    const words = originalTitle.trim().split(/\s+/u).filter(Boolean);
    return words.length > DOCUMENT_CARD_TITLE_WORD_LIMIT
      ? `${words.slice(0, DOCUMENT_CARD_TITLE_WORD_LIMIT).join(" ")}…`
      : originalTitle;
  };

  const displayTitle = formatCardTitle(title);

  /* Render */
  return (
    <div className={styles.documentCard} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <span className={styles.cardDate}>{formatDate(updatedAt)}</span>

        {!actions && (
          <Tooltip text="Delete document">
            <button
              type="button"
              className={styles.trashIcon}
              onClick={handleDelete}
              aria-label="Delete document"
              disabled={!isOnline}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path
                  d="M6 8h12v12c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 5h14v3H5V5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M10 5V3h4v2" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M10 11v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14 11v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </Tooltip>
        )}
      </div>

      <h3 className={styles.cardTitle} title={title || "Untitled Document"}>
        {displayTitle}
      </h3>

      <p className={styles.cardPreview}>{createPreview(content)}</p>

      {actions && <div className={styles.cardActions}>{actions}</div>}
    </div>
  );
};

export default React.memo(DocumentCard);
