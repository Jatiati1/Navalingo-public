// frontend/src/api/textProcessingService.js
// Text-processing API for translation and grammar correction.
// - Normalizes rejectionList into ["start-end", ...] strings and deduplicates.
// - Exposes processText plus convenience wrappers (translateText, correctGrammar, correctLive).

import axiosInstance from "./axios";

// Normalize any incoming rejectionList to ["start-end", ...] and dedupe.
const normalizeRejectionList = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];

  const toKey = (item) => {
    if (typeof item === "string") return item.trim(); // "start-end"
    if (item && typeof item === "object" && typeof item.rangeKey === "string") {
      return item.rangeKey.trim();
    }
    if (
      item &&
      typeof item === "object" &&
      typeof item.start === "number" &&
      typeof item.end === "number"
    ) {
      return `${item.start}-${item.end}`;
    }
    return null;
  };

  const keys = list.map(toKey).filter(Boolean);
  return Array.from(new Set(keys));
};

// Core request
const processText = async (
  originalText,
  action,
  sourceLang,
  targetLang,
  maxWords,
  extra = {} // { rejectionList?, snippet? }
) => {
  if (maxWords == null) {
    throw new ReferenceError("processText → maxWords is undefined");
  }

  const extraPayload = { ...extra };
  if (extra.rejectionList) {
    extraPayload.rejectionList = normalizeRejectionList(extra.rejectionList);
  }

  try {
    const payload = {
      text: originalText, // backend expects 'text'
      action,
      sourceLang,
      targetLang,
      maxWords,
      extra: extraPayload,
    };
    const { data } = await axiosInstance.post("/process-text", payload);
    return data;
  } catch (err) {
    throw err;
  }
};

// Convenience wrappers

// Translate a full document or a highlighted snippet (if provided).
export const translateText = (
  originalText,
  snippet, // null or string
  targetLang,
  baseCap,
  liveCap
) => {
  const effectiveLimit = liveCap || baseCap;

  if (snippet && snippet.trim()) {
    return processText(
      originalText,
      "translate-snippet",
      null, // backend auto-detects
      targetLang,
      effectiveLimit,
      { snippet }
    );
  }

  return processText(
    originalText,
    "translate",
    null,
    targetLang,
    effectiveLimit
  );
};

// Full grammar review; optional rejectionList to skip regions.
export const correctGrammar = (originalText, maxWords, rejectionList = []) =>
  processText(originalText, "correct-live", null, null, maxWords, {
    rejectionList,
  });

// Lightweight live correction (kept for compatibility).
export const correctLive = (originalText, lang = "en", maxWords = 999) =>
  processText(originalText, "correct-live", lang, lang, maxWords);

export default processText;
