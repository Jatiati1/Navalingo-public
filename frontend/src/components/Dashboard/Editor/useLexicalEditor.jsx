// frontend/src/components/Dashboard/Editor/useLexicalEditor.jsx
import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

/** Safely parse and hydrate the editor from a JSON string. */
function safeHydrate(editor, jsonString) {
  if (!jsonString) return;
  try {
    const parsed = editor.parseEditorState(jsonString);
    editor.setEditorState(parsed);
  } catch {
    // Ignore malformed state
  }
}

/** Initialize editor content once from provided JSON. */
export function InitializeContentPlugin({ json }) {
  const [editor] = useLexicalComposerContext();
  const didHydrate = useRef(false);

  useEffect(() => {
    if (editor && json && !didHydrate.current) {
      didHydrate.current = true;
      safeHydrate(editor, json);
    }
  }, [editor, json]);

  return null;
}

/** Invoke a callback when the editor is ready. */
export function OnInitializedPlugin({ onInitialized }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onInitialized?.(editor);
  }, [editor, onInitialized]);

  return null;
}

/** Autofocus the editor on mount. */
export function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const id = setTimeout(
      () => editor?.focus(undefined, { defaultSelection: "rootStart" }),
      120
    );
    return () => clearTimeout(id);
  }, [editor]);

  return null;
}

/** Toggle editability based on the `locked` prop. */
export function LockTogglePlugin({ locked }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(!locked);
  }, [editor, locked]);

  return null;
}

/** Programmatically focus the editor when `focusRequest` increments. */
export function RefocusPlugin({ focusRequest }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (focusRequest > 0 && editor.isEditable()) {
      editor.focus();
    }
  }, [focusRequest, editor]);

  return null;
}

/** Restore focus to the editor after saving, unless another input has focus. */
export function SaveFocusPlugin({ locked }) {
  const [editor] = useLexicalComposerContext();
  const wasLockedRef = useRef(locked);

  useEffect(() => {
    if (wasLockedRef.current && !locked) {
      const el = document.activeElement;
      const isInTextInput =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");

      if (!isInTextInput) {
        setTimeout(() => editor.focus(), 0);
      }
    }
    wasLockedRef.current = locked;
  }, [editor, locked]);

  return null;
}
