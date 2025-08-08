// frontend/src/hooks/usesettings.js

import { useState, useEffect } from "react";
import {
  saveLanguagePreference,
  getLanguagePreference,
} from "../api/userService";

/**
 * useSettings — manages simple UI settings (currently: language).
 * - Initializes from persisted preference (default "en").
 * - Persists updates via saveLanguagePreference.
 * - Exposes { language, loading, handleLanguageChange }.
 *
 * Example:
 *   const { language, handleLanguageChange } = useSettings();
 *   <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} />
 */
export default function useSettings() {
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await getLanguagePreference();
        setLanguage(savedLanguage || "en");
      } catch {
        /* no-op */
      }
    };
    loadLanguage();
  }, []);

  const handleLanguageChange = async (selectedLanguage) => {
    setLoading(true);
    try {
      setLanguage(selectedLanguage);
      await saveLanguagePreference(selectedLanguage);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  };

  return { language, handleLanguageChange, loading };
}
