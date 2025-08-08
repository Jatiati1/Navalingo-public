// src/features/search/components/SearchBar.jsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import useSearch from "../useSearch";
import "./SearchBar.css";

const MagnifierIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="11"
      cy="11"
      r="7"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <line
      x1="16.65"
      y1="16.65"
      x2="21"
      y2="21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function SearchBar({
  placeholder = "Search…",
  onQueryChange,
  autoFocus = false,
  showDropdown = true,
  className = "",
  renderItem,
  emptyMessage = "No results",
  clearable = true,
  maxVisibleResults,
  showIcon = false,
}) {
  const { query, setQuery, results } = useSearch();
  const [selectedId, setSelectedId] = useState(null);
  const inputRef = useRef(null);
  const listboxId = "searchbar-listbox";

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      onQueryChange && onQueryChange(val);
    },
    [setQuery, onQueryChange]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onQueryChange && onQueryChange("");
    setSelectedId(null);
    inputRef.current?.focus();
  }, [setQuery, onQueryChange]);

  const displayResults = useMemo(() => {
    if (typeof maxVisibleResults === "number")
      return results.slice(0, maxVisibleResults);
    return results;
  }, [results, maxVisibleResults]);

  const hasQuery = Boolean(query.trim());
  const showEmpty = showDropdown && hasQuery && displayResults.length === 0;

  // Grouping if any result includes `section`
  const groupingEnabled = useMemo(
    () => displayResults.some((r) => r.section),
    [displayResults]
  );

  const grouped = useMemo(() => {
    if (!groupingEnabled) return null;
    const map = new Map();
    displayResults.forEach((r) => {
      const section = r.section || "Other";
      if (!map.has(section)) map.set(section, []);
      map.get(section).push(r);
    });
    return Array.from(map.entries());
  }, [displayResults, groupingEnabled]);

  // Flat list of selectable results in display order (used for keyboard nav)
  const flatItems = useMemo(() => {
    if (!groupingEnabled) return displayResults;
    const out = [];
    grouped.forEach(([, items]) => out.push(...items));
    return out;
  }, [grouped, groupingEnabled, displayResults]);

  // Set a default selection when results appear/change
  useEffect(() => {
    if (!flatItems.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !flatItems.find((r) => r.id === selectedId)) {
      setSelectedId(flatItems[0].id);
    }
  }, [flatItems, selectedId]);

  const dropdownOpen =
    showDropdown && hasQuery && (displayResults.length > 0 || showEmpty);

  const onKeyDown = useCallback(
    (e) => {
      if (!dropdownOpen || !flatItems.length) {
        if (e.key === "Escape" && query) handleClear();
        return;
      }

      const idx = flatItems.findIndex((r) => r.id === selectedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = flatItems[(idx + 1 + flatItems.length) % flatItems.length];
        setSelectedId(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = flatItems[(idx - 1 + flatItems.length) % flatItems.length];
        setSelectedId(prev.id);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const curr = flatItems[idx >= 0 ? idx : 0];
        curr?.action?.();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    },
    [dropdownOpen, flatItems, selectedId, handleClear, query]
  );

  const activeId = selectedId ? `sb-opt-${selectedId}` : undefined;

  return (
    <div
      className={`search-wrapper pill ${dropdownOpen ? "open" : ""} ${className}`}
    >
      {showIcon && (
        <span className="sb-icon" aria-hidden="true">
          <MagnifierIcon />
        </span>
      )}

      <input
        ref={inputRef}
        value={query}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`search-input ${showIcon ? "with-icon" : ""}`}
        autoFocus={autoFocus}
        aria-label={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={dropdownOpen ? "true" : "false"}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeId}
      />

      {clearable && query && (
        <button
          type="button"
          className="search-clear-btn"
          aria-label="Clear search"
          onClick={handleClear}
        >
          ×
        </button>
      )}

      {showDropdown && displayResults.length > 0 && (
        <ul className="search-dropdown" role="listbox" id={listboxId}>
          {groupingEnabled
            ? grouped.map(([section, items]) => (
                <React.Fragment key={section}>
                  <li
                    className="search-group-header"
                    aria-disabled="true"
                    tabIndex={-1}
                  >
                    {section}
                  </li>
                  {items.map((r) => {
                    const isSelected = r.id === selectedId;
                    const id = `sb-opt-${r.id}`;
                    const onMouseDown = (e) => {
                      e.preventDefault();
                      r.action?.();
                    };
                    return (
                      <li
                        key={r.id}
                        id={id}
                        role="option"
                        aria-selected={isSelected}
                        className={`search-group-item${isSelected ? " selected" : ""}`}
                        tabIndex={-1}
                        onMouseEnter={() => setSelectedId(r.id)}
                        onMouseDown={onMouseDown}
                      >
                        {renderItem ? renderItem(r) : r.label}
                      </li>
                    );
                  })}
                </React.Fragment>
              ))
            : displayResults.map((r) => {
                const isSelected = r.id === selectedId;
                const id = `sb-opt-${r.id}`;
                const onMouseDown = (e) => {
                  e.preventDefault();
                  r.action?.();
                };
                return (
                  <li
                    key={r.id}
                    id={id}
                    role="option"
                    aria-selected={isSelected}
                    className={isSelected ? "selected" : undefined}
                    tabIndex={-1}
                    onMouseEnter={() => setSelectedId(r.id)}
                    onMouseDown={onMouseDown}
                  >
                    {renderItem ? renderItem(r) : r.label}
                  </li>
                );
              })}
        </ul>
      )}

      {showEmpty && (
        <ul className="search-dropdown empty" role="listbox" id={listboxId}>
          <li className="empty" tabIndex={-1}>
            {emptyMessage}
          </li>
        </ul>
      )}
    </div>
  );
}
