// frontend/src/components/Dashboard/useReviewPanel.js
// Review-panel state: preview-only edits, stable rejection fingerprinting,
// backend-friendly rejections (rangeKey), no direct editor writes.

import { useState, useMemo, useEffect, useCallback, useRef } from "react";

export function useReviewPanel({
  originalText,
  suggestions: streamedSuggestions,
  onReject,
  onFinish,
  onListEmpty = () => {},
  editor, // kept for API compatibility; not used
}) {
  const [liveText, setLiveText] = useState(originalText);
  const [internalSuggestions, setInternalSuggestions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Track accepted edits (for preview-only position remapping)
  const editsRef = useRef([]);
  // Track locally rejected items so newly streamed suggestions stay hidden
  const rejectedKeysRef = useRef(new Set());

  const getTexts = (s) => ({
    original: s.original ?? s.original_phrase,
    replacement: s.replacement ?? s.suggested_phrase,
  });

  // Stable fingerprint for exact occurrence in the *original* text
  const makeKey = (s) => {
    const { original, replacement } = getTexts(s);
    return `${s.start}:${s.end}:${original}→${replacement}`;
  };

  // Normalize inbound suggestions, drop any locally rejected
  useEffect(() => {
    const mapped = (streamedSuggestions ?? []).map((s, index) => ({
      ...s,
      id: s.id ?? `sugg-${index}-${s.start}`,
      original_phrase: s.original ?? s.original_phrase,
      suggested_phrase: s.replacement ?? s.suggested_phrase,
    }));

    const filtered = mapped.filter(
      (s) => !rejectedKeysRef.current.has(makeKey(s))
    );

    setInternalSuggestions(filtered);
    setLiveText(originalText);
    editsRef.current = [];
  }, [streamedSuggestions, originalText]);

  // Remap a position based on previously accepted preview edits
  const remapPos = useCallback((pos) => {
    return editsRef.current.reduce((newPos, edit) => {
      if (pos <= edit.start) return newPos;
      if (pos > edit.end) return newPos + edit.delta;
      return edit.start + edit.newText.length;
    }, pos);
  }, []);

  // Live positions reflect preview-only edits
  const suggestionsWithLivePositions = useMemo(
    () =>
      internalSuggestions.map((s) => ({
        ...s,
        start: remapPos(s.start),
        end: remapPos(s.end),
      })),
    [internalSuggestions, remapPos]
  );

  // Notify when suggestions clear
  const prevLenRef = useRef(internalSuggestions.length);
  useEffect(() => {
    if (prevLenRef.current > 0 && internalSuggestions.length === 0) {
      onListEmpty();
    }
    prevLenRef.current = internalSuggestions.length;
  }, [internalSuggestions.length, onListEmpty]);

  // Keep an active suggestion selected
  useEffect(() => {
    if (
      suggestionsWithLivePositions.length > 0 &&
      !suggestionsWithLivePositions.some((s) => s.id === activeId)
    ) {
      setActiveId(suggestionsWithLivePositions[0].id);
    } else if (suggestionsWithLivePositions.length === 0) {
      setActiveId(null);
    }
  }, [suggestionsWithLivePositions, activeId]);

  const activeSuggestion = useMemo(
    () => suggestionsWithLivePositions.find((s) => s.id === activeId) ?? null,
    [suggestionsWithLivePositions, activeId]
  );

  // Accept single suggestion (preview-only)
  const acceptActive = useCallback(() => {
    if (!activeSuggestion) return;

    const { start, end, suggested_phrase } = activeSuggestion;
    const nextText =
      liveText.substring(0, start) + suggested_phrase + liveText.substring(end);

    setLiveText(nextText);

    const delta = suggested_phrase.length - (end - start);
    editsRef.current.push({ start, end, delta, newText: suggested_phrase });

    setInternalSuggestions((prev) =>
      prev.filter((s) => s.id !== activeSuggestion.id)
    );
  }, [activeSuggestion, liveText]);

  // Reject (uses *base* positions; remembers a stable fingerprint)
  const rejectByItem = useCallback(
    (sugg) => {
      if (!sugg) return;

      // Use the base record to ensure stable coordinates
      const base = internalSuggestions.find((x) => x.id === sugg.id) ?? sugg;

      const key = makeKey(base);
      rejectedKeysRef.current.add(key);

      const { original, replacement } = getTexts(base);

      // Backend-friendly payload with a stable rangeKey
      const payload = {
        id: base.id,
        start: base.start,
        end: base.end,
        rangeKey: `${base.start}-${base.end}`,
        original,
        replacement,
        rule: base.rule ?? base.ruleId ?? base.category ?? null,
        message: base.message ?? base.explanation ?? "",
        type: base.type ?? "grammar",
      };

      onReject?.(payload);
      setInternalSuggestions((prev) => prev.filter((x) => makeKey(x) !== key));
    },
    [internalSuggestions, onReject]
  );

  // Accept all → compute final text in order and hand off to parent
  const handleAcceptAll = useCallback(() => {
    let next = originalText;
    let shift = 0;

    internalSuggestions
      .slice()
      .sort((a, b) => a.start - b.start)
      .forEach((s) => {
        const aStart = s.start + shift;
        const aEnd = s.end + shift;
        const repl = s.suggested_phrase ?? s.replacement;

        next = next.substring(0, aStart) + repl + next.substring(aEnd);
        shift += repl.length - (s.end - s.start);
      });

    onFinish(next);
  }, [onFinish, originalText, internalSuggestions]);

  // Keyboard/arrow navigation between suggestions
  const handleNavigate = useCallback(
    (dir) => {
      if (suggestionsWithLivePositions.length < 2) return;
      const idx = suggestionsWithLivePositions.findIndex(
        (s) => s.id === activeId
      );
      const nextIdx =
        (idx + dir + suggestionsWithLivePositions.length) %
        suggestionsWithLivePositions.length;
      setActiveId(suggestionsWithLivePositions[nextIdx].id);
    },
    [suggestionsWithLivePositions, activeId]
  );

  return {
    suggestions: suggestionsWithLivePositions,
    activeSuggestion,
    liveText,
    activeId,
    setActiveId,
    handleAccept: acceptActive,
    handleReject: () => rejectByItem(activeSuggestion),
    handleAcceptAll,
    handleNavigate,
  };
}
