// frontend/src/utils/wordLimit.js

// Base caps
const FREE_BASE_CAP = 200;
const PRO_BASE_CAP = 600;
const BUFFER_MIN = 20;

// Tier percentages
const FREE_INFLATE_PCT = 0.12; // 12% for Free users
const PRO_INFLATE_PCT = 0.14; // 14% for Pro users
const FREE_DEFLATE_PCT = 0.06; // 6% for Free users
const PRO_DEFLATE_PCT = 0.03; // 3% for Pro users

/**
 * Return word-limit parameters for the user's tier.
 * @param {boolean} isPro
 * @returns {{baseCap:number, inflatePct:number, deflatePct:number}}
 */
export function getWordLimits(isPro) {
  if (isPro) {
    return {
      baseCap: PRO_BASE_CAP,
      inflatePct: PRO_INFLATE_PCT,
      deflatePct: PRO_DEFLATE_PCT,
    };
  }
  return {
    baseCap: FREE_BASE_CAP,
    inflatePct: FREE_INFLATE_PCT,
    deflatePct: FREE_DEFLATE_PCT,
  };
}

/**
 * Calculate the inflated cap for AI processing.
 * @param {number} wordCount
 * @param {boolean} isPro
 * @returns {number}
 */
export const calculateInflatedCap = (wordCount, isPro) => {
  const { inflatePct } = getWordLimits(isPro);
  const buffer = Math.max(wordCount * inflatePct, BUFFER_MIN);
  return Math.ceil(wordCount + buffer);
};

/**
 * Calculate the deflated (“chase down”) cap for manual editing.
 * @param {number} wordCount
 * @param {boolean} isPro
 * @returns {number}
 */
export const calculateDeflatedCap = (wordCount, isPro) => {
  const { deflatePct } = getWordLimits(isPro);
  const buffer = Math.max(wordCount * deflatePct, BUFFER_MIN);
  return Math.ceil(wordCount + buffer);
};
