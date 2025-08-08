// src/features/search/index.js

export { SearchProvider } from "./SearchProvider.jsx";
export { default as useSearch } from "./useSearch.js";

export { makeAccountAdapter } from "./adapters/accountAdapter.js";
export { makeDocsLocalAdapter } from "./adapters/docsLocalAdapter.js";

// Deprecated: kept for backward compatibility. Prefer makeDocsLocalAdapter(() => docs).
export const docsAdapter = {
  async search(/* term */) {
    return [];
  },
};

export { default as SearchBar } from "./components/SearchBar.jsx";
export { default as CommandPalette } from "./components/CommandPalette.jsx";
