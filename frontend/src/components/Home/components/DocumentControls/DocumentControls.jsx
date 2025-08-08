// frontend/src/components/Home/components/DocumentControls/DocumentControls.jsx
import React, { useCallback } from "react";
import styles from "./DocumentControls.module.css";

/**
 * Inline icons (local, lightweight).
 */
const PlusCircleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="12" fill="#ffffff" />
    <path
      d="M12 7v10M7 12h10"
      stroke="#0D4770"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MagnifierIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="11"
      cy="11"
      r="7"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <line
      x1="16.65"
      y1="16.65"
      x2="21"
      y2="21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * DocumentControls
 * New document button + search field for the documents list.
 *
 * Props:
 * - onCreate: () => void
 * - searchTerm: string
 * - onSearchChange: (value: string) => void
 * - isOnline: boolean
 * - onClear?: () => void
 */
function DocumentControls({
  onCreate,
  searchTerm,
  onSearchChange,
  isOnline,
  onClear,
}) {
  const handleInput = useCallback(
    (e) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const handleClear = useCallback(() => {
    (onClear ?? onSearchChange)("");
  }, [onClear, onSearchChange]);

  return (
    <div className={styles.docControls}>
      {/* New document */}
      <button
        type="button"
        className={styles.newDocBtn}
        onClick={onCreate}
        aria-label="Create new document"
        disabled={!isOnline}
      >
        <PlusCircleIcon />
        <span className={styles.newDocLabel}>New document</span>
      </button>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">
          <MagnifierIcon />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search documents..."
          aria-label="Search documents"
          value={searchTerm}
          onChange={handleInput}
          autoComplete="off"
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default DocumentControls;
