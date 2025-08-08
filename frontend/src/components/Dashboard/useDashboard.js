// frontend/src/components/Dashboard/useDashboard.js
// Dashboard state/composition hook: wires document lifecycle + AI assistant.

import { useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useActiveDocument } from "./hooks/useActiveDocument.js";
import { useAIAssistant } from "./hooks/useAIAssistant.js";
import { useToast } from "../UI/Toast/index.js";

export function useDashboard(docId, liveCap) {
  const { currentUser } = useAuth();
  const editorRef = useRef(null);
  const isPro = currentUser?.subscriptionTier === "pro";
  const { showToast } = useToast();

  // Document fetch/save and editor change handling
  const {
    isFetchingDocument,
    isUpdatingContent,
    isUpdatingTitle,
    error,
    normalizedDocumentData,
    docTitle,
    setDocTitle,
    debouncedTitleSave,
    handleEditorChange,
    updateEditorContent, // used by “Accept All” to commit final text
  } = useActiveDocument(docId, editorRef, liveCap);

  // AI assistant: grammar review and translation
  const {
    processingType,
    suggestions,
    inReview,
    startGrammarReview,
    startTranslation,
    handleFinishReview,
    handleRejectSuggestion,
    handleClearSuggestions,
  } = useAIAssistant(editorRef, docId, updateEditorContent, isPro, liveCap);

  // Capture the editor instance once initialized
  const onEditorInitialized = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  // Loading flags
  const isInitialLoading = isFetchingDocument && !normalizedDocumentData;
  const isSaving = isUpdatingContent || isUpdatingTitle;

  // Credits (always provide a complete shape)
  const credits = {
    current: currentUser?.credits?.current ?? 0,
    max: currentUser?.credits?.max ?? (isPro ? 50 : 10),
    resets: currentUser?.credits?.resets ?? null,
  };

  return {
    // Loading
    isInitialLoading,
    isSaving,

    // Data / state
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
    credits,

    // Callbacks
    onEditorInitialized,
    handleEditorChange,
    handleFinishReview,
    handleRejectSuggestion,
    handleClearSuggestions,
    startGrammarReview,
    startTranslation,

    // Editor update path for “Accept All”
    updateEditorContent,

    // Misc
    showToast,
    isPro,
  };
}
