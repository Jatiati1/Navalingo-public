// src/features/search/SearchProvider.jsx
import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const SearchContext = createContext(null);

/**
 * Provides debounced search with race-safety and loading/error flags.
 *
 * @param {object} props
 * @param {{ search:(term:string)=>Promise<Array>|Array }} props.adapter
 * @param {number} [props.delay=250]   Debounce ms
 * @param {number} [props.minLength=1] Minimum query length to trigger search
 * @param {React.ReactNode} props.children
 */
export function SearchProvider({
  adapter,
  delay = 250,
  minLength = 1,
  children,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const term = (query || "").trim();

    // No adapter or below min length → clear results and stop.
    if (!adapter || term.length < minLength) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const currentReq = ++reqIdRef.current;
    const timer = setTimeout(
      () => {
        setLoading(true);
        setError(null);

        Promise.resolve(adapter.search(term))
          .then((out) => {
            if (reqIdRef.current !== currentReq) return; // stale response
            setResults(Array.isArray(out) ? out : []);
          })
          .catch((e) => {
            if (reqIdRef.current !== currentReq) return; // stale error
            setResults([]);
            setError(e || new Error("Search failed"));
          })
          .finally(() => {
            if (reqIdRef.current === currentReq) setLoading(false);
          });
      },
      Math.max(0, delay)
    );

    // Cleanup: cancel debounce and invalidate in-flight resolution.
    return () => {
      clearTimeout(timer);
      // bump reqId so any late resolution is ignored
      reqIdRef.current++;
    };
  }, [query, delay, adapter, minLength]);

  const value = useMemo(
    () => ({ query, setQuery, results, loading, error }),
    [query, results, loading, error]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
