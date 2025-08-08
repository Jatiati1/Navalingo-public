// frontend/src/components/Dashboard/Editor/plugins/CharacterLimitPlugin.jsx
// Enforces a word cap in Lexical: blocks over-limit input and truncates paste.

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  PASTE_COMMAND,
  CONTROLLED_TEXT_INSERTION_COMMAND,
} from "lexical";

const words = (txt) => (txt.trim() ? txt.trim().split(/\s+/u) : []);

export default function CharacterLimitPlugin({ liveCap }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    const wouldBeOverLimit = (incomingText = "") => {
      let isOver = false;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const currentWc = words($getRoot().getTextContent()).length;
        const selectedWc = $isRangeSelection(selection)
          ? words(selection.getTextContent()).length
          : 0;
        const incomingWc = words(incomingText).length;
        const newWc = currentWc - selectedWc + incomingWc;
        isOver = newWc > liveCap;
      });
      return isOver;
    };

    // Block over-limit keystrokes at the DOM level.
    const handleBeforeInput = (e) => {
      if (editor.isComposing() || !editor.isEditable()) return;
      const text = e.data ?? "";
      if (text && wouldBeOverLimit(text)) {
        e.preventDefault();
        window.dispatchEvent(new Event("lexi:hardCap"));
      }
    };

    // Block other programmatic text insertions.
    const handleCommandInsertion = (text) => {
      if (editor.isEditable() && wouldBeOverLimit(text)) {
        window.dispatchEvent(new Event("lexi:hardCap"));
        return true;
      }
      return false;
    };

    // Attach/detach DOM listener to the editor root.
    const unregisterRootListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener("beforeinput", handleBeforeInput);
        }
        if (rootElement) {
          rootElement.addEventListener("beforeinput", handleBeforeInput);
        }
      }
    );

    const unregisterInsert = editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      handleCommandInsertion,
      COMMAND_PRIORITY_CRITICAL
    );

    // Truncate pasted text to remaining capacity.
    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const editorState = editor.getEditorState();
        const clipboardText =
          (event.clipboardData || event.dataTransfer)?.getData("text/plain") ??
          "";
        if (!clipboardText) return false;

        const { currentWc, selectedWc } = editorState.read(() => ({
          currentWc: words($getRoot().getTextContent()).length,
          selectedWc: $isRangeSelection($getSelection())
            ? words($getSelection().getTextContent()).length
            : 0,
        }));

        const remaining = liveCap - (currentWc - selectedWc);
        if (remaining <= 0) {
          window.dispatchEvent(new Event("lexi:hardCap"));
          return true;
        }

        const pastedWords = words(clipboardText);
        if (pastedWords.length <= remaining) return false;

        const truncatedText = pastedWords.slice(0, remaining).join(" ");
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(truncatedText);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    return () => {
      unregisterRootListener();
      unregisterInsert();
      unregisterPaste();
    };
  }, [editor, liveCap]);

  return null;
}
