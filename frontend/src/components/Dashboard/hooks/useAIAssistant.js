// frontend/src/components/Dashboard/hooks/useAIAssistant.js
import { useState, useCallback, useRef, useEffect } from "react";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  correctGrammar,
  translateText,
} from "../../../api/textProcessingService.js";
import { useToast } from "../../UI/Toast/index.js";
import {
  getEditorToast,
  getEditorToastFromError,
} from "../../../utils/editor/dashboardErrors.js";

/**
 * AI assistance for grammar correction and translation.
 * Handles toasts, credit updates, suggestion review, and rejection persistence.
 */
export function useAIAssistant(
  editorRef,
  docId,
  updateEditorContent,
  isPro,
  liveCap
) {
  const { showToast, removeToast } = useToast();
  const { updateUser } = useAuth();

  const [processingType, setProcessingType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [inReview, setInReview] = useState(false);
  const latestSourceTextRef = useRef("");
  const [rejectionList, setRejectionList] = useState([]);

  // Load persisted rejections per document
  useEffect(() => {
    const stored = localStorage.getItem(`rejectionList_${docId}`);
    if (!stored) {
      setRejectionList([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setRejectionList(Array.isArray(parsed) ? parsed : []);
    } catch {
      localStorage.removeItem(`rejectionList_${docId}`);
      setRejectionList([]);
    }
  }, [docId]);

  const handleApiResponse = useCallback(
    (response) => {
      if (response?.credits) {
        updateUser((prev) => ({ ...prev, credits: response.credits }));
      }
    },
    [updateUser]
  );

  const startGrammarReview = useCallback(
    async (text) => {
      if (processingType || !editorRef.current || !text.trim()) {
        const { message, severity } = getEditorToast("EMPTY_TEXT_ERROR");
        showToast(message, { severity, dedupeKey: "empty-text-err" });
        return;
      }

      latestSourceTextRef.current = text;

      // Validate stored rejections against current text
      const validRejections = rejectionList.filter((item) => {
        if (
          !item ||
          typeof item.rangeKey !== "string" ||
          typeof item.originalText !== "string"
        ) {
          return false;
        }
        const [start, end] = item.rangeKey.split("-").map(Number);
        const currentSlice = text.substring(start, end);
        return currentSlice === item.originalText;
      });

      if (validRejections.length !== rejectionList.length) {
        setRejectionList(validRejections);
        localStorage.setItem(
          `rejectionList_${docId}`,
          JSON.stringify(validRejections)
        );
      }

      const toastId = showToast("Analyzing Document", {
        severity: "info",
        duration: 30000,
        dedupeKey: "correcting-in-progress",
      });

      setProcessingType("correct");
      try {
        const res = await correctGrammar(
          text,
          liveCap,
          validRejections.map((i) => i.rangeKey)
        );
        removeToast(toastId);
        handleApiResponse(res);

        if (res.edits?.length) {
          setSuggestions(res.edits);
          setInReview(true);
        } else {
          const { message, severity } = getEditorToast("NO_ISSUES_FOUND");
          showToast(message, { severity });
        }
      } catch (error) {
        removeToast(toastId);
        const t = getEditorToastFromError(error, { action: "correct" });
        showToast(t.message, { severity: t.severity });
      } finally {
        setProcessingType(null);
      }
    },
    [
      processingType,
      editorRef,
      liveCap,
      showToast,
      removeToast,
      rejectionList,
      docId,
      handleApiResponse,
    ]
  );

  const startTranslation = useCallback(
    async (lang, closeDropdown) => {
      const editor = editorRef.current;
      if (processingType || !editor) return;

      let fullText = "";
      let selectedText = "";

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        fullText = $getRoot().getTextContent();
        if ($isRangeSelection(selection)) {
          selectedText = selection.getTextContent();
        }
      });

      if (!fullText.trim()) {
        const { message, severity } = getEditorToast("EMPTY_TEXT_ERROR");
        showToast(message, { severity, dedupeKey: "empty-text-err" });
        closeDropdown?.();
        return;
      }

      const toastId = showToast("Translating", {
        severity: "info",
        duration: 20000,
        dedupeKey: "translating-in-progress",
      });

      setProcessingType("translate");
      try {
        if (selectedText.trim()) {
          const hasLeadingSpace = /^\s/.test(selectedText);
          const hasTrailingSpace = /\s$/.test(selectedText);
          const snippet = selectedText.trim();

          const res = await translateText(
            fullText,
            snippet,
            lang,
            isPro ? 600 : 200,
            liveCap
          );
          removeToast(toastId);
          handleApiResponse(res);

          let translated = res.result;
          if (hasLeadingSpace) translated = " " + translated;
          if (hasTrailingSpace) translated += " ";

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertText(translated);
            }
          });
        } else {
          const res = await translateText(
            fullText,
            null,
            lang,
            isPro ? 600 : 200,
            liveCap
          );
          removeToast(toastId);
          handleApiResponse(res);

          const { resultArray } = res;
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            resultArray.forEach((line) => {
              const p = $createParagraphNode();
              if (line) p.append($createTextNode(line));
              root.append(p);
            });
          });

          // If your updateEditorContent persists state immediately, keep this call.
          // (Signature may vary in your codebase.)
          updateEditorContent?.();
        }
      } catch (error) {
        removeToast(toastId);
        const t = getEditorToastFromError(error, { action: "translate" });
        showToast(t.message, { severity: t.severity });
      } finally {
        setProcessingType(null);
        closeDropdown?.();
      }
    },
    [
      processingType,
      editorRef,
      isPro,
      liveCap,
      showToast,
      removeToast,
      handleApiResponse,
      updateEditorContent,
    ]
  );

  const handleFinishReview = useCallback(() => {
    setInReview(false);
    setSuggestions([]);
  }, []);

  const handleRejectSuggestion = useCallback(
    (rejected) => {
      if (!rejected) return;

      const entry = {
        rangeKey: rejected.rangeKey ?? `${rejected.start}-${rejected.end}`,
        originalText: rejected.original_phrase,
      };

      const next = [...rejectionList, entry];
      const unique = Array.from(
        new Map(next.map((i) => [i.rangeKey, i])).values()
      );

      setRejectionList(unique);
      localStorage.setItem(`rejectionList_${docId}`, JSON.stringify(unique));

      setSuggestions((prev) => prev.filter((s) => s.id !== rejected.id));
    },
    [docId, rejectionList]
  );

  return {
    processingType,
    suggestions,
    inReview,
    startGrammarReview,
    startTranslation,
    handleRejectSuggestion,
    handleFinishReview,
    handleClearSuggestions: handleFinishReview,
  };
}
