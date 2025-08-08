// frontend/src/components/Dashboard/hooks/useActiveDocument.js

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { useToast } from "../../UI/Toast";
import {
  getDocument,
  updateDocumentTitle,
  updateDocumentContent,
} from "../../../api/documentService";
import { getEditorToastFromError } from "../../../utils/editor/dashboardErrors.js";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";

const VALID_EMPTY_STATE = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

/**
 * Manages fetching, debounced saving, and programmatic updates for a document.
 */
export function useActiveDocument(docId, editorRef, liveCap) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [docTitle, setDocTitle] = useState("");
  const lastSavedContentRef = useRef(null);
  const isProgrammaticUpdate = useRef(false);

  // Fetch and normalize document
  const {
    data: documentData,
    isLoading: isFetchingDocument,
    error,
  } = useQuery({
    queryKey: ["document", docId],
    queryFn: () => getDocument(docId),
  });

  const normalizedDocumentData = useMemo(() => {
    if (!documentData) return null;
    const isValidContent =
      typeof documentData.content === "string" &&
      documentData.content.startsWith("{") &&
      documentData.content.endsWith("}");
    return isValidContent
      ? documentData
      : { ...documentData, content: VALID_EMPTY_STATE };
  }, [documentData]);

  useEffect(() => {
    if (normalizedDocumentData?.title) {
      setDocTitle(
        normalizedDocumentData.title !== "Untitled Document"
          ? normalizedDocumentData.title
          : ""
      );
    }
    if (normalizedDocumentData?.content) {
      lastSavedContentRef.current = normalizedDocumentData.content;
    }
  }, [normalizedDocumentData]);

  // Mutations
  const updateTitleMutation = useMutation({
    mutationFn: (newTitle) => updateDocumentTitle(docId, newTitle),
    onSuccess: (_data, newTitle) => {
      queryClient.setQueryData(["document", docId], (old) => ({
        ...old,
        title: newTitle,
      }));
    },
    onError: (err) => {
      const t = getEditorToastFromError(err, { action: "save_title" });
      showToast(t.message, { severity: t.severity });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: ({ content, cap }) =>
      updateDocumentContent(docId, content, cap),
    onSuccess: (_data, { content, cap }) => {
      lastSavedContentRef.current = content;
      queryClient.setQueryData(["document", docId], (old) => ({
        ...old,
        content,
        liveWordCap: cap,
      }));
    },
    onError: (err) => {
      const t = getEditorToastFromError(err, { action: "save_content" });
      showToast(t.message, { severity: t.severity });
    },
  });

  // Debounced saves
  const debouncedTitleSave = useDebouncedCallback((newTitle) => {
    updateTitleMutation.mutate(newTitle.trim() || "Untitled Document");
  }, 1500);

  const debouncedContentSave = useDebouncedCallback((jsonString) => {
    updateContentMutation.mutate({ content: jsonString, cap: liveCap });
  }, 800);

  // Editor change handler (skips programmatic updates)
  const handleEditorChange = useCallback(
    (editorState) => {
      if (isProgrammaticUpdate.current) return;
      const jsonString = JSON.stringify(editorState.toJSON());
      if (jsonString !== lastSavedContentRef.current) {
        debouncedContentSave(jsonString);
      }
    },
    [debouncedContentSave]
  );

  /**
   * Replace editor content with plain text, preserve paragraph breaks,
   * tag the update for cap-inflation logic, and save immediately.
   */
  const updateEditorContent = useCallback(
    (newContent) => {
      const editor = editorRef.current;
      if (!editor) return;

      isProgrammaticUpdate.current = true;

      const lines = newContent.split("\n");
      editor.update(
        () => {
          const root = $getRoot();
          root.clear();
          lines.forEach((line) => {
            const p = $createParagraphNode();
            if (line) p.append($createTextNode(line));
            root.append(p);
          });
        },
        { tag: `correct-grammar-${Date.now()}` }
      );

      const jsonString = JSON.stringify(editor.getEditorState().toJSON());
      lastSavedContentRef.current = jsonString;

      debouncedContentSave.cancel();
      updateContentMutation.mutate({ content: jsonString, cap: liveCap });

      setTimeout(() => {
        isProgrammaticUpdate.current = false;
      }, 0);
    },
    [editorRef, debouncedContentSave, updateContentMutation, liveCap]
  );

  return {
    isFetchingDocument,
    isUpdatingContent: updateContentMutation.isPending,
    isUpdatingTitle: updateTitleMutation.isPending,
    error,
    normalizedDocumentData,
    docTitle,
    setDocTitle,
    debouncedTitleSave,
    handleEditorChange,
    updateEditorContent,
  };
}
