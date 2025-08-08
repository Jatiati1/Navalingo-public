// src/features/search/useSearch.js
import { useContext } from "react";
import { SearchContext } from "./SearchProvider";

/**
 * Access the search context.
 * Provides: { query, setQuery, results, loading, error }
 */
export default function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a <SearchProvider>");
  }
  return ctx;
}
