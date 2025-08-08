// frontend/src/components/Dashboard/Editor/hooks/useWordCap.jsx
// Word-cap management for Lexical editor: live counter, dynamic cap inflate/deflate, and enforcement.

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import {
  getWordLimits,
  calculateInflatedCap,
  calculateDeflatedCap,
} from "../../../../utils/wordLimit";
import CharacterLimitPlugin from "../plugins/CharacterLimitPlugin";
import styles from "../LexicalEditor.module.css";

/** Compact word counter with soft/hard-cap styling. */
export function WordCountDisplay({ liveCap, onWordCountChange }) {
  const [editor] = useLexicalComposerContext();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const wc =
            $getRoot().getTextContent().trim().split(/\s+/u).filter(Boolean)
              .length || 0;
          setCount(wc);
          onWordCountChange?.(wc);
          if (wc) {
            clearTimeout(hideTimer.current);
            setVisible(true);
          } else {
            hideTimer.current = setTimeout(() => setVisible(false), 200);
          }
        });
      }),
    [editor, onWordCountChange]
  );

  const [shake, setShake] = useState(false);
  useEffect(() => {
    const h = () => setShake((v) => !v);
    window.addEventListener("lexi:hardCap", h);
    return () => window.removeEventListener("lexi:hardCap", h);
  }, []);

  let cls = styles.wordCounter;
  if (count >= liveCap) {
    cls += ` ${styles.max}`;
    if (shake) cls += ` ${styles.shake}`;
  } else if (count / liveCap >= 0.95) {
    cls += ` ${styles.warn}`;
  }

  return (
    <div className={cls} style={{ visibility: visible ? "visible" : "hidden" }}>
      {count} / {liveCap} words
    </div>
  );
}

/** Maintains the live cap: inflates on AI inserts; deflates (“chase down”) on manual edits. */
function CapManager({ liveCapRef, setLiveCap, isPro, baseCap, documentData }) {
  const [editor] = useLexicalComposerContext();
  const prevCountRef = useRef(0);
  const lastTagHandledRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    // Initial cap: prefer saved value, else derive from current content.
    editor.getEditorState().read(() => {
      const wc =
        $getRoot().getTextContent().trim().split(/\s+/u).filter(Boolean)
          .length || 0;
      const savedCap = documentData?.liveWordCap;
      const initialCap =
        savedCap || (wc > baseCap ? calculateInflatedCap(wc, isPro) : baseCap);
      setLiveCap(initialCap);
      prevCountRef.current = wc;
    });

    // Ongoing updates.
    return editor.registerUpdateListener(({ editorState, tags }) => {
      const newWc =
        editorState.read(
          () =>
            $getRoot().getTextContent().trim().split(/\s+/u).filter(Boolean)
              .length
        ) || 0;

      // Inflate when an AI write exceeds current cap; gate by unique tag.
      const aiTag =
        [...tags].find(
          (t) =>
            t.startsWith("translate-final-") || t.startsWith("correct-grammar-")
        ) || null;
      const isNewAiUpdate = aiTag && aiTag !== lastTagHandledRef.current;

      if (isNewAiUpdate) {
        if (newWc > liveCapRef.current)
          setLiveCap(calculateInflatedCap(newWc, isPro));
        if (newWc >= liveCapRef.current) lastTagHandledRef.current = aiTag;
      }

      // Deflate when the user trims content (but never below baseCap).
      if (newWc < prevCountRef.current && newWc < liveCapRef.current) {
        const target = Math.max(calculateDeflatedCap(newWc, isPro), baseCap);
        if (target < liveCapRef.current) setLiveCap(target);
      }

      prevCountRef.current = newWc;
    });
  }, [editor, isPro, baseCap, setLiveCap, liveCapRef, documentData]);

  return null;
}

/** Hook surface: live cap value, a manager component, and a limit-enforcement plugin. */
export function useWordCap(isPro, documentData) {
  const { baseCap } = useMemo(() => getWordLimits(isPro), [isPro]);
  const [liveCap, setLiveCap] = useState(baseCap);
  const liveCapRef = useRef(liveCap);

  useEffect(() => {
    liveCapRef.current = liveCap;
  }, [liveCap]);

  useEffect(() => {
    setLiveCap(baseCap);
  }, [baseCap]);

  const WordCapManager = useCallback(
    () => (
      <CapManager
        liveCapRef={liveCapRef}
        setLiveCap={setLiveCap}
        isPro={isPro}
        baseCap={baseCap}
        documentData={documentData}
      />
    ),
    [isPro, baseCap, documentData]
  );

  const WordLimitEnforcer = useCallback(
    () => <CharacterLimitPlugin liveCap={liveCap} />,
    [liveCap]
  );

  return { liveCap, WordCapManager, WordLimitEnforcer };
}
