// src/features/search/adapters/docsLocalAdapter.js
// Local (in-memory) fuzzy search adapter for document titles.
// Use when the full docs list is small enough to load once and filter client-side.

import Fuse from "fuse.js";

/** @typedef {{ id: string, title?: string }} DocLike */

/**
 * @typedef {Object} DocsLocalAdapter
 * @property {(term: string) => Promise<Array<{
 *   id: string,
 *   label: string,
 *   score: number,
 *   matches?: any[],
 *   raw: DocLike,
 *   action: () => void
 * }>>} search
 * @property {() => void} reindex
 * @property {(opts: Partial<Fuse.IFuseOptions<DocLike>>) => void} setOptions
 * @property {() => Fuse<DocLike>} getFuseInstance
 * @property {() => string|null} getLastQuery
 */

// Default Fuse.js options tuned for short titles.
const DEFAULT_FUSE_OPTIONS = {
  keys: ["title"],
  includeScore: true,
  includeMatches: false,
  shouldSort: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
  isCaseSensitive: false,
  useExtendedSearch: false,
  distance: 100,
};

/**
 * Create a local docs adapter.
 *
 * @param {() => DocLike[]} docsGetter Returns the current docs array (keeps results fresh).
 * @param {Object} [options]
 * @param {number} [options.limit=20] Max results to return.
 * @param {Partial<Fuse.IFuseOptions<DocLike>>} [options.fuseOptions] Optional overrides.
 * @returns {DocsLocalAdapter}
 */
export function makeDocsLocalAdapter(
  docsGetter,
  { limit = 20, fuseOptions = {} } = {}
) {
  if (typeof docsGetter !== "function") {
    throw new Error("makeDocsLocalAdapter requires a function docsGetter()");
  }

  // Internal state
  let fuse = new Fuse([], { ...DEFAULT_FUSE_OPTIONS, ...fuseOptions });
  let indexedCount = 0;
  let lastQuery = null;

  // Normalize docs and rebuild the Fuse collection.
  function reindex() {
    const docs = docsGetter() || [];
    fuse.setCollection(
      docs.map((d) => ({
        ...d,
        title: (d.title && String(d.title)) || "Untitled Document",
      }))
    );
    indexedCount = docs.length;
  }

  // Allow runtime tweaking of Fuse options; rebuild index afterward.
  function setOptions(next) {
    if (!next || typeof next !== "object") return;
    fuse = new Fuse([], {
      ...DEFAULT_FUSE_OPTIONS,
      ...fuseOptions,
      ...next,
    });
    reindex();
  }

  /**
   * Fuzzy search by title.
   * Empty/whitespace query returns [] (caller can show the full list).
   */
  async function search(term) {
    const query = (term || "").trim();
    lastQuery = query;
    if (!query) return [];

    // Reindex if docs length changed since last index
    const docs = docsGetter() || [];
    if (indexedCount !== docs.length) {
      reindex();
    }

    let results;
    try {
      results = fuse.search(query, { limit });
    } catch {
      // Fallback: substring filter if Fuse throws for any reason.
      const qLower = query.toLowerCase();
      return docs
        .filter((d) =>
          ((d.title && d.title.toLowerCase()) || "").includes(qLower)
        )
        .slice(0, limit)
        .map((d) => ({
          id: d.id,
          label: d.title || "Untitled Document",
          score: 0,
          matches: [],
          raw: d,
          action: () => (window.location.href = `/dashboard/${d.id}`),
        }));
    }

    return results.map((r) => ({
      id: r.item.id,
      label: r.item.title || "Untitled Document",
      score: r.score ?? 0,
      matches: r.matches,
      raw: r.item,
      action: () => (window.location.href = `/dashboard/${r.item.id}`),
    }));
  }

  function getFuseInstance() {
    return fuse;
  }

  function getLastQuery() {
    return lastQuery;
  }

  // Build initial index so first search is fast.
  reindex();

  return {
    search,
    reindex,
    setOptions,
    getFuseInstance,
    getLastQuery,
  };
}

export default makeDocsLocalAdapter;
