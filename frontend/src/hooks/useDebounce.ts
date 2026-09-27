import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid value changes (e.g. keyboard search input).
 * Ensures API requests or heavy re-computations are not triggered on every keystroke.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
