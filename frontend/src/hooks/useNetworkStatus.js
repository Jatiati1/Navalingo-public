// frontend/src/hooks/useNetworkStatus.js
import { useState, useEffect } from "react";

/**
 * useNetworkStatus
 * Tracks the browser's online/offline status and updates state on network events.
 *
 * @returns {boolean} True when the browser is online; false otherwise.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
