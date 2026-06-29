import { useState } from "react";

/**
 * Like useState but persists to sessionStorage.
 * State survives navigation within the session but resets on tab close.
 * Returns [value, setter, resetFn].
 */
export function useSessionFilter<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = (next: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try { sessionStorage.setItem(key, JSON.stringify(resolved)); } catch {}
      return resolved;
    });
  };

  const reset = () => {
    setValue(defaultValue);
    try { sessionStorage.removeItem(key); } catch {}
  };

  return [value, set, reset] as const;
}

/** Remove all session filter keys matching a prefix (for bulk reset). */
export function clearSessionFilters(prefix: string) {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {}
}
