// frontend/src/components/Dashboard/Editor/plugins/CorrectionPlugin.jsx
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

/**
 * React/Lexical plugin that reacts to `suggestions` changes and schedules
 * decoration logic. Implement the highlight application inside `applyDecorations`.
 */
export default function CorrectionPlugin({ suggestions = [] }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const applyDecorations = () => {
      // TODO: Clear previous highlights and apply new ones for the current
      // `suggestions`. Use Lexical transforms/decoration APIs to mark ranges.
    };

    // Run once immediately for the current suggestions.
    editor.update(applyDecorations);

    // Re-apply after any editor update (e.g., text changes, selection moves).
    const unregister = editor.registerUpdateListener(() => {
      editor.update(applyDecorations);
    });

    return unregister;
  }, [editor, suggestions]);

  return null;
}
