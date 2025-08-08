// src/features/search/components/CommandPalette.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import useSearch from "../useSearch";
import "./CommandPalette.css";

export default function CommandPalette() {
  const { query, setQuery, results } = useSearch();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef(null);
  const listboxId = "command-palette-listbox";

  // Toggle with Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // When opened, focus the input and reset selection
  useEffect(() => {
    if (open) {
      setSelected(results.length ? 0 : -1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a valid selection when results change
  useEffect(() => {
    if (!results.length) {
      setSelected(-1);
    } else if (selected < 0 || selected >= results.length) {
      setSelected(0);
    }
  }, [results, selected]);

  const close = useCallback(() => setOpen(false), []);

  const onKeyDown = useCallback(
    (e) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (!results.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = results[selected];
        if (item && typeof item.action === "function") {
          item.action();
          close();
        }
      }
    },
    [open, results, selected, close]
  );

  if (!open) return null;

  const activeId =
    selected >= 0 && results[selected]
      ? `palette-opt-${results[selected].id}`
      : undefined;

  return (
    <div
      className="palette-backdrop"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-label"
    >
      <div
        className="palette-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search…"
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          id="command-palette-input"
        />
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby="command-palette-label"
        >
          {results.map((r, idx) => {
            const id = `palette-opt-${r.id}`;
            const isSelected = idx === selected;
            return (
              <li
                key={r.id}
                id={id}
                role="option"
                aria-selected={isSelected}
                className={isSelected ? "selected" : undefined}
                onMouseEnter={() => setSelected(idx)}
                onMouseDown={() => {
                  // onMouseDown avoids blur before click during mousedown/up sequence
                  r.action?.();
                  close();
                }}
              >
                {r.label}
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="empty" aria-disabled="true">
              No results
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
