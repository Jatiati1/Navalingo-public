// frontend/src/components/Dashboard/Editor/plugins/TranslationPlugin.jsx

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  translateSnippet,
  translateText,
} from "../../../../api/textProcessingService";
import { getWordLimits } from "../../../../utils/editor/wordLimit";

/**
 * Translates either the selected text or the full document as plain text.
 * Note: Rich formatting is not preserved (paragraph breaks are).
 */
export async function handleTranslate({
  lang,
  editorInstance,
  isPro,
  selectedText,
  liveCap,
}) {
  if (!editorInstance) throw new Error("Editor not available.");

  const { baseCap } = getWordLimits(isPro);
  const TAG = `translate-final-${Date.now()}`;

  // Selection-only translation
  if (selectedText) {
    const leadWS = /^\s/.test(selectedText);
    const trailWS = /\s$/.test(selectedText);
    const snippet = selectedText.trim();
    if (!snippet) throw new Error("Selection is only whitespace.");

    const fullText = editorInstance
      .getEditorState()
      .read(() => $getRoot().getTextContent());

    const { result } = await translateSnippet(
      fullText,
      snippet,
      lang,
      baseCap,
      liveCap
    );

    let insert = result;
    if (leadWS) insert = " " + insert;
    if (trailWS) insert += " ";

    editorInstance.update(
      () => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertText(insert);
      },
      { tag: TAG }
    );
    return;
  }

  // Full-document translation
  const originalText = editorInstance
    .getEditorState()
    .read(() => $getRoot().getTextContent());

  if (!originalText.trim()) throw new Error("Cannot translate empty text.");

  const { resultArray: translatedLines } = await translateText(
    originalText,
    null, // auto-detect source language
    lang,
    baseCap,
    liveCap
  );

  editorInstance.update(
    () => {
      const root = $getRoot();
      root.clear();

      if (translatedLines && translatedLines.length > 0) {
        translatedLines.forEach((line) => {
          const p = $createParagraphNode();
          if (line) p.append($createTextNode(line));
          root.append(p);
        });
      }
    },
    { tag: TAG }
  );
}
