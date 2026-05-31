import { useEffect, useState } from 'react';

export function useRetainedValue<T>(value: T | undefined) {
  const [retainedValue, setRetainedValue] = useState<T | undefined>(value);

  useEffect(() => {
    if (value !== undefined) {
      setRetainedValue(value);
    }
  }, [value]);

  return value ?? retainedValue;
}
