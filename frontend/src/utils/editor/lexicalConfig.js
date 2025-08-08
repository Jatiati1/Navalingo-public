// frontend/src/utils/editor/lexicalConfig.js

import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
} from "lexical";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

/** Maximum words allowed when processing text (frontend guard). */
export const DEFAULT_MAX_WORDS = 999;

/**
 * Get current editor contents as HTML.
 * @param {import('lexical').LexicalEditor} editor
 * @returns {Promise<string>}
 */
function extractHtml(editor) {
  return new Promise((resolve, reject) => {
    if (!editor?.getEditorState) {
      return reject(new TypeError("extractHtml: invalid editor instance"));
    }
    editor.getEditorState().read(() => {
      try {
        resolve($generateHtmlFromNodes(editor, null));
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Count words in the current editor state.
 * @returns {number}
 */
function countWords() {
  return $getRoot().getTextContent().trim().split(/\s+/u).filter(Boolean)
    .length;
}

/**
 * Throw if text is empty or exceeds the provided cap.
 * @param {number} total
 * @param {number} cap
 */
function ensureWithinCap(total, cap) {
  if (cap == null) {
    throw new Error("maxWordsLimit not supplied by caller.");
  }
  if (total === 0) throw new Error("Cannot process empty text.");
  if (total > cap) {
    throw new Error(`Text exceeds word-limit (${total}/${cap}).`);
  }
}

/**
 * Translate the editor contents using a backend API that returns HTML.
 * @param {import('lexical').LexicalEditor} editor
 * @param {(html:string, sourceLang:string|null, targetLang:string, maxWords:number)=>Promise<{result:string}>} apiFn
 * @param {string} targetLang
 * @param {number} [maxWordsLimit=DEFAULT_MAX_WORDS]
 */
export async function processTextForTranslation(
  editor,
  apiFn,
  targetLang,
  maxWordsLimit = DEFAULT_MAX_WORDS
) {
  const html = await extractHtml(editor);
  if (!html || /^<p>(<br>)?<\/p>$/.test(html)) {
    throw new Error("Cannot translate empty text.");
  }

  const wc = editor.getEditorState().read(countWords);
  ensureWithinCap(wc, maxWordsLimit);

  // Backend auto-detects source language, so pass null.
  const result = await apiFn(html, null, targetLang, maxWordsLimit);
  const newHtml = result?.result;

  if (newHtml && newHtml.trim()) {
    replaceContent(editor, newHtml, { tag: "translate" });
    return;
  }

  throw new Error("Translation service returned a malformed response.");
}

/**
 * Run grammar correction using a backend API that returns HTML.
 * @param {import('lexical').LexicalEditor} editor
 * @param {(html:string, targetLang:string, maxWords:number)=>Promise<{result:string}>} apiFn
 * @param {(editor: import('lexical').LexicalEditor, html:string)=>void} replaceFn
 * @param {number} [maxWordsLimit=DEFAULT_MAX_WORDS]
 */
export async function processTextForCorrection(
  editor,
  apiFn,
  replaceFn,
  maxWordsLimit = DEFAULT_MAX_WORDS
) {
  const html = await extractHtml(editor);
  if (!html || /^<p>(<br>)?<\/p>$/.test(html)) {
    throw new Error("Cannot correct empty text.");
  }

  const wc = editor.getEditorState().read(countWords);
  ensureWithinCap(wc, maxWordsLimit);

  const { result } = await apiFn(html, "en", maxWordsLimit);
  if (!result?.trim()) throw new Error("Grammar-correction returned empty.");

  replaceFn(editor, result);
}

/**
 * Replace editor content with provided HTML (HTML-aware).
 * @param {import('lexical').LexicalEditor} editor
 * @param {string} htmlString
 * @param {object} [options]
 */
export function replaceContent(editor, htmlString, options = {}) {
  if (!editor?.update || !htmlString?.trim()) return;

  editor.update(() => {
    const root = $getRoot();
    root.clear();

    const parser = new DOMParser();
    const dom = parser.parseFromString(htmlString, "text/html");

    const lexicalNodes = $generateNodesFromDOM(editor, dom);
    $insertNodes(lexicalNodes);

    root.selectEnd();
  }, options);
}

/**
 * Extract plain text from a Lexical JSON string (for previews).
 * @param {string} jsonString
 * @returns {string}
 */
export function getTextFromLexicalJSON(jsonString) {
  if (!jsonString) return "";
  try {
    const editorState = JSON.parse(jsonString);
    const root = editorState.root;
    let text = "";

    function walk(node) {
      if (node.type === "text") {
        text += node.text;
      }
      if (node.children) {
        if (
          node.type === "paragraph" &&
          text.length > 0 &&
          !text.endsWith(" ")
        ) {
          text += " ";
        }
        node.children.forEach(walk);
      }
    }

    walk(root);
    return text.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
