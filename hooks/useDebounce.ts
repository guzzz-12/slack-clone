import { useEffect, useState } from "react";

export const useDebounce = (value: string, delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const debouncer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(debouncer);
    }

  }, [value, delay]);

  return {debouncedValue};
};