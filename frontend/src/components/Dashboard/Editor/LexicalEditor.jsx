// frontend/src/components/Dashboard/Editor/LexicalEditor.jsx

import React, { memo, useMemo, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import styles from "./LexicalEditor.module.css";
import editorTheme from "./themes/EditorTheme";
import { WordCountDisplay } from "./hooks/useWordCap.jsx";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";

import {
  InitializeContentPlugin,
  OnInitializedPlugin,
  AutoFocusPlugin,
  LockTogglePlugin,
  RefocusPlugin,
  SaveFocusPlugin,
} from "./useLexicalEditor.jsx";

/* Show credits only at key thresholds; never when empty. */
function shouldShowCreditCounter(credits, maxCredits, wordCount) {
  if (wordCount === 0) return false;
  if (maxCredits === 50)
    return credits === 50 || credits === 25 || credits <= 5;
  if (maxCredits === 10) return credits === 10 || credits <= 5;
  return false;
}

const CreditCounter = ({ currentCredits, maxCredits, wordCount }) => {
  if (!shouldShowCreditCounter(currentCredits, maxCredits, wordCount))
    return null;
  return (
    <div className={styles.creditCounter}>
      Credits: {currentCredits} / {maxCredits}
    </div>
  );
};

const EditorCore = ({
  initialEditorJSON,
  onChange,
  onInitialized,
  locked,
  focusRequest,
  liveCap,
  WordCapManager,
  WordLimitEnforcer,
  currentCredits,
  maxCredits,
}) => {
  const [wordCount, setWordCount] = useState(0);

  return (
    <div className={styles.editor}>
      <div className={styles.scrollableText}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className={styles.contentEditable} />
          }
          placeholder={<div className={styles.placeholder}>Enter text…</div>}
          ErrorBoundary={() => (
            <div className={styles.placeholder}>Editor error.</div>
          )}
        />
        <HistoryPlugin />
        <InitializeContentPlugin json={initialEditorJSON} />
        <OnChangePlugin onChange={onChange} />
        <OnInitializedPlugin onInitialized={onInitialized} />
        <AutoFocusPlugin />
        <LockTogglePlugin locked={locked} />
        <RefocusPlugin focusRequest={focusRequest} />
        <SaveFocusPlugin locked={locked} />
        <WordCapManager />
        <WordLimitEnforcer />
      </div>

      <div className={styles.fadeOverlay} />

      <div className={styles.editorFooter}>
        <WordCountDisplay liveCap={liveCap} onWordCountChange={setWordCount} />
        <CreditCounter
          currentCredits={currentCredits}
          maxCredits={maxCredits}
          wordCount={wordCount}
        />
      </div>
    </div>
  );
};

const LexicalEditor = memo(function LexicalEditor(props) {
  const { locked, docId } = props;

  const initialConfig = useMemo(
    () => ({
      namespace: "LexiLingoEditor",
      theme: editorTheme,
      editable: !locked,
      onError: (e) => {
        // Let React error boundaries handle this.
        throw e;
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
    }),
    [locked]
  );

  return (
    <LexicalComposer initialConfig={initialConfig} key={docId}>
      <EditorCore {...props} />
    </LexicalComposer>
  );
});

export default LexicalEditor;
