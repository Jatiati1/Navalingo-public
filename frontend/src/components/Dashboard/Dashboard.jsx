// frontend/src/components/Dashboard/Dashboard.jsx
// Dashboard workspace: loads a document, renders the editor and review panel,
// and wires translation/correction with credit and word-cap handling.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDropdown, useNetworkStatus } from "../../hooks";
import { useDashboard } from "./useDashboard.js";
import { useWordCap } from "./Editor/hooks/useWordCap";
import { $getRoot } from "lexical";
import {
  getEditorToast,
  getEditorToastFromError,
} from "../../utils/editor/dashboardErrors.js";

import LoadingSpinner from "../UI/LoadingSpinner/LoadingSpinner.jsx";
import Header from "../UI/Header/Header.jsx";
import Button from "../UI/Button/Button.jsx";
import Dropdown from "../UI/Dropdown/Dropdown.jsx";
import LexicalEditor from "./Editor/LexicalEditor.jsx";
import ReviewPanel from "./ReviewPanel.jsx";
import { EditorProvider } from "../../context/EditorContext.jsx";
import styles from "./Dashboard.module.css";

const MAX_TITLE_WORDS = 25;
const MAX_CHARS_PER_WORD = 60;

/** Returns a short string like “6d 22h”, “3h 10m”, or “now”. */
const getTimeUntilReset = (resetTimestamp) => {
  if (!resetTimestamp) return "soon";
  const now = new Date();
  const resetDate = resetTimestamp.toDate
    ? resetTimestamp.toDate()
    : new Date(resetTimestamp);
  const diff = resetDate - now;
  if (diff <= 0) return "now";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function Dashboard() {
  // Routing and UI state
  const { docId } = useParams();
  const navigate = useNavigate();
  const translateDropdown = useDropdown(false);
  const isOnline = useNetworkStatus();
  const [dropdownHeight, setDropdownHeight] = useState(0);
  const [textForReview, setTextForReview] = useState("");

  // Word-cap (depends on plan tier)
  const { isPro: tempIsPro } = useDashboard(docId, null);
  const { liveCap, WordCapManager, WordLimitEnforcer } = useWordCap(tempIsPro);

  // Core controller: loading/saving, editor refs, actions
  const {
    isInitialLoading,
    isSaving,
    error,
    currentUser,
    editorRef,
    docTitle,
    setDocTitle,
    debouncedTitleSave,
    normalizedDocumentData,
    inReview,
    processingType,
    suggestions,
    onEditorInitialized,
    handleEditorChange,
    handleFinishReview,
    handleRejectSuggestion,
    handleClearSuggestions,
    startGrammarReview,
    startTranslation,
    updateEditorContent,
    showToast,
    isPro,
    credits,
  } = useDashboard(docId, liveCap);

  // Surface document-load errors via toast
  useEffect(() => {
    if (!error) return;
    const toastConfig = getEditorToastFromError(error, { action: "load" });
    showToast(toastConfig.message, {
      severity: toastConfig.severity,
      persist: toastConfig.persist,
      dedupeKey: `doc-load-error-${docId}`,
    });
  }, [error, showToast, docId]);

  // Measure translation dropdown height for layout offset
  useEffect(() => {
    if (!translateDropdown.isOpen || !translateDropdown.dropdownRef.current)
      return;
    const t = setTimeout(() => {
      const rect =
        translateDropdown.dropdownRef.current?.getBoundingClientRect();
      if (rect) setDropdownHeight(rect.height);
    }, 0);
    return () => clearTimeout(t);
  }, [translateDropdown.isOpen, translateDropdown.dropdownRef]);

  // Title input with constraints and debounced save
  const handleTitleChange = (e) => {
    let title = e.target.value;

    if (title.split(" ").some((w) => w.length > MAX_CHARS_PER_WORD)) {
      const { message, severity } = getEditorToast(
        "TITLE_CHAR_LIMIT_EXCEEDED",
        {
          limit: MAX_CHARS_PER_WORD,
        }
      );
      showToast(message, { severity });
      return;
    }

    const words = title.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_TITLE_WORDS) {
      title = words.slice(0, MAX_TITLE_WORDS).join(" ");
      const { message, severity } = getEditorToast(
        "TITLE_WORD_LIMIT_EXCEEDED",
        {
          limit: MAX_TITLE_WORDS,
        }
      );
      showToast(message, { severity });
    }

    setDocTitle(title);
    debouncedTitleSave(title);
  };

  // Credit availability check and upgrade prompt
  const handleCreditCheck = () => {
    if (credits.current > 0) return true;

    const timeRemaining = getTimeUntilReset(credits.resets);
    if (isPro) {
      showToast("Weekly credit limit reached.", {
        severity: "info",
        subMessage: `Credits reset in ${timeRemaining}.`,
        dedupeKey: "insufficient-credits",
      });
    } else {
      showToast(
        "Weekly credit limit reached. Upgrade to Pro to get 50 credits now, plus more features.",
        {
          severity: "warning",
          persist: true,
          dedupeKey: "insufficient-credits",
          actionLabel: "Upgrade to Pro",
          onAction: () => navigate("/account/subscription"),
          subMessage: `Credits reset in ${timeRemaining}`,
        }
      );
    }
    return false;
  };

  // Start grammar review on current editor content
  const handleStartGrammarReview = () => {
    if (!handleCreditCheck()) return;
    translateDropdown.close();
    if (!editorRef.current) return;

    const currentText = editorRef.current
      .getEditorState()
      .read(() => $getRoot().getTextContent("\n"));

    setTextForReview(currentText);
    startGrammarReview(currentText, liveCap);
  };

  // Apply accepted suggestions then exit review mode
  const handleReviewCompletion = (finalText) => {
    if (typeof finalText === "string") {
      updateEditorContent(finalText);
    }
    handleFinishReview();
  };

  return (
    <div className={styles.app}>
      {isInitialLoading && (
        <div className="pageLoadingContainer">
          <LoadingSpinner />
        </div>
      )}

      <Header title="Navalingo" showMenu={!!currentUser} />

      <div
        className={styles.workspaceWrapper}
        data-mode={inReview ? "review" : "edit"}
      >
        {/* Editor pane */}
        <div
          className={`${styles.editorPane} ${
            translateDropdown.isOpen ? styles.dropdownIsOpen : ""
          }`}
          style={{ "--dropdown-height": `${dropdownHeight}px` }}
        >
          <main className={styles.container}>
            <div className={styles.titleContainer}>
              <input
                className={styles.documentTitle}
                value={docTitle}
                placeholder="Untitled Document"
                onChange={handleTitleChange}
                onBlur={() => debouncedTitleSave.flush()}
                disabled={!!processingType || inReview || !isOnline}
              />
            </div>

            <div className={styles.editorWrapper}>
              <EditorProvider editor={editorRef.current}>
                <LexicalEditor
                  key={docId}
                  docId={docId}
                  initialEditorJSON={normalizedDocumentData?.content ?? null}
                  onInitialized={onEditorInitialized}
                  onChange={handleEditorChange}
                  locked={!!processingType || inReview || !isOnline || isSaving}
                  isPro={isPro}
                  WordCapManager={WordCapManager}
                  WordLimitEnforcer={WordLimitEnforcer}
                  liveCap={liveCap}
                  currentCredits={credits.current}
                  maxCredits={credits.max}
                />
              </EditorProvider>
            </div>

            <div className={styles.footerBand}>
              <div className={styles.buttonGroup}>
                {/* Translate button + dropdown */}
                <div
                  className={styles.translateWrapper}
                  ref={translateDropdown.buttonRef}
                >
                  <Button
                    className={
                      processingType === "translate"
                        ? `${styles.dashboardToolButton} ${styles.processingButton}`
                        : styles.dashboardToolButton
                    }
                    onClick={translateDropdown.toggle}
                    disabled={!!processingType || inReview || !isOnline}
                  >
                    {processingType === "translate"
                      ? "Translating…"
                      : "Translate"}
                  </Button>

                  {translateDropdown.isOpen && (
                    <Dropdown
                      ref={translateDropdown.dropdownRef}
                      className={styles.translateDropdown}
                    >
                      {["en", "es"].map((code) => (
                        <button
                          key={code}
                          className="menu-item"
                          onClick={() => {
                            if (!handleCreditCheck()) {
                              translateDropdown.close();
                              return;
                            }
                            startTranslation(code, translateDropdown.close);
                          }}
                          disabled={!isOnline}
                        >
                          {new Intl.DisplayNames(["en"], {
                            type: "language",
                          }).of(code)}
                        </button>
                      ))}
                    </Dropdown>
                  )}
                </div>

                {/* Grammar check */}
                <Button
                  className={
                    processingType === "correct"
                      ? `${styles.dashboardToolButton} ${styles.processingButton}`
                      : styles.dashboardToolButton
                  }
                  onClick={handleStartGrammarReview}
                  disabled={!!processingType || inReview || !isOnline}
                >
                  {processingType === "correct"
                    ? "Correcting…"
                    : "Correct Grammar"}
                </Button>
              </div>
            </div>
          </main>
        </div>

        {/* Review pane */}
        <div className={styles.reviewPane}>
          {inReview && (
            <ReviewPanel
              originalText={textForReview}
              editor={editorRef.current}
              suggestions={suggestions}
              onReject={handleRejectSuggestion}
              onFinish={handleReviewCompletion}
              onClear={handleClearSuggestions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
