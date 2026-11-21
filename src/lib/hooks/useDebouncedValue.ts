"use client";

import { useEffect, useState } from "react";

/**
 * Debounces rapid state updates (e.g. search inputs) to prevent redundant
 * memo recomputations and full-list re-renders on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
