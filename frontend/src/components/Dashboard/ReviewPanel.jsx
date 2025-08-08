// frontend/src/components/Dashboard/ReviewPanel.jsx
// Review panel for grammar suggestions: full-text preview, per-suggestion inspector, and actions.

import React from "react";
import DOMPurify from "dompurify";
import { useReviewPanel } from "./useReviewPanel";
import styles from "./ReviewPanel.module.css";
import Spinner from "../UI/LoadingSpinner/LoadingSpinner";

/* Category color coding */
const RED_FOR_CORRECTNESS = "#d9534f";
const BLUE_FOR_STYLE = "#0275d8";

const categoryColorMap = {
  Spelling: RED_FOR_CORRECTNESS,
  Grammar: RED_FOR_CORRECTNESS,
  Punctuation: RED_FOR_CORRECTNESS,
  "Gender Agreement": RED_FOR_CORRECTNESS,
  "Verb Mood": RED_FOR_CORRECTNESS,
  "Preposition Use": RED_FOR_CORRECTNESS,
  Capitalization: RED_FOR_CORRECTNESS,
  "Double Negatives": RED_FOR_CORRECTNESS,
  "Subject-Verb Agreement": RED_FOR_CORRECTNESS,
  Phrasing: BLUE_FOR_STYLE,
  "Sentence Structure": BLUE_FOR_STYLE,
  Clarity: BLUE_FOR_STYLE,
  "Word Choice": BLUE_FOR_STYLE,
  Formality: BLUE_FOR_STYLE,
  Repetition: BLUE_FOR_STYLE,
  Default: "#6c757d",
};

/* Single-suggestion inspector card */
const SuggestionCard = ({
  issue,
  onAccept,
  onReject,
  onPrevious,
  onNext,
  canNavigate,
}) => {
  if (!issue) {
    return (
      <div className={styles.inspectorPlaceholder}>
        <p>All suggestions have been addressed. Click the “X” to finish.</p>
      </div>
    );
  }

  const categoryColor =
    categoryColorMap[issue.category] || categoryColorMap.Default;

  const safeOriginal = DOMPurify.sanitize(
    issue.original_phrase ?? issue.original
  );
  const safeReplacement = DOMPurify.sanitize(
    issue.suggested_phrase ?? issue.replacement
  );
  const safeExplanation = DOMPurify.sanitize(issue.explanation);

  return (
    <div className={styles.inspectorCard}>
      <div className={styles.cardNavigation}>
        <button
          className={styles.navButton}
          onClick={onPrevious}
          disabled={!canNavigate}
          aria-label="Previous suggestion"
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          className={styles.navButton}
          onClick={onNext}
          disabled={!canNavigate}
          aria-label="Next suggestion"
        >
          <svg viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <p className={styles.inspectorCategory} style={{ color: categoryColor }}>
        {issue.category}
      </p>

      <p className={styles.inspectorSuggestion}>
        Change{" "}
        <strong
          className={styles.inspectorOriginal}
          dangerouslySetInnerHTML={{ __html: safeOriginal }}
        />{" "}
        to{" "}
        <strong
          className={styles.inspectorReplacement}
          dangerouslySetInnerHTML={{ __html: safeReplacement }}
        />
      </p>

      <hr className={styles.inspectorDivider} />

      <p
        className={styles.inspectorExplanation}
        dangerouslySetInnerHTML={{ __html: safeExplanation }}
      />

      <div className={styles.inspectorActions}>
        <button
          onClick={onAccept}
          className={`${styles.inspectorButton} ${styles.accept}`}
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className={`${styles.inspectorButton} ${styles.reject}`}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

/* Main review panel */
export default function ReviewPanel({
  originalText,
  suggestions = [],
  isLoading,
  onReject,
  onFinish,
  onClear = () => {},
  editor,
}) {
  const {
    suggestions: panelSuggestions,
    activeSuggestion,
    liveText,
    activeId,
    setActiveId,
    handleAccept,
    handleReject,
    handleAcceptAll,
    handleNavigate,
  } = useReviewPanel({
    originalText,
    suggestions,
    onReject,
    onFinish,
    onListEmpty: onClear,
    editor,
  });

  // Auto-finish if no suggestions remain; commit latest text if it changed.
  if (!isLoading && panelSuggestions.length === 0 && !activeSuggestion) {
    if (liveText !== originalText) {
      setTimeout(() => onFinish(liveText), 0);
    }
    return null;
  }

  const handleAcceptAllAndClose = () => {
    handleAcceptAll();
  };

  // Full-text preview with inline underline highlights
  const renderReviewDraft = () => {
    let lastIndex = 0;
    const parts = [];

    const sorted = [...panelSuggestions].sort((a, b) => a.start - b.start);

    sorted.forEach((sugg) => {
      if (sugg.start > lastIndex) {
        parts.push(liveText.substring(lastIndex, sugg.start));
      }

      const textAtPosition = liveText.substring(sugg.start, sugg.end);
      const underlineColor =
        categoryColorMap[sugg.category] || categoryColorMap.Default;

      let cls = styles.suggestionUnderline;
      if (sugg.id === activeId) {
        cls +=
          underlineColor === RED_FOR_CORRECTNESS
            ? ` ${styles.activeSuggestionRed}`
            : ` ${styles.activeSuggestionBlue}`;
      }

      parts.push(
        <span
          key={sugg.id}
          className={cls}
          style={{ borderBottomColor: underlineColor }}
          onClick={() => setActiveId(sugg.id)}
        >
          {textAtPosition}
        </span>
      );

      lastIndex = sugg.end;
    });

    if (lastIndex < liveText.length) {
      parts.push(liveText.substring(lastIndex));
    }

    return parts.map((part, i) => (
      <React.Fragment key={i}>{part}</React.Fragment>
    ));
  };

  return (
    <div className={styles.reviewContainer}>
      <section className={styles.mainContent}>
        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <span>
              {panelSuggestions.length} Suggestion
              {panelSuggestions.length !== 1 ? "s" : ""}
              {isLoading && <Spinner size="small" />}
            </span>
            <button
              onClick={handleAcceptAllAndClose}
              className={styles.acceptAllButton}
              disabled={panelSuggestions.length === 0 || isLoading}
            >
              Accept&nbsp;All
            </button>
          </h2>

          <div className={styles.panelContent}>{renderReviewDraft()}</div>
        </div>

        <aside className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <span>Suggestion&nbsp;Details</span>
            <button
              className={styles.closeButton}
              aria-label="Close review"
              onClick={() => {
                onClear();
                onFinish(liveText);
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
              </svg>
            </button>
          </h2>

          <div className={styles.cardsContainer}>
            <SuggestionCard
              issue={activeSuggestion}
              onAccept={handleAccept}
              onReject={handleReject}
              onNext={() => handleNavigate(1)}
              onPrevious={() => handleNavigate(-1)}
              canNavigate={panelSuggestions.length > 1}
            />
          </div>
        </aside>
      </section>
    </div>
  );
}
