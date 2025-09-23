import { useCallback, useState } from 'react';

export default function useInput(initial = '') {
  const [value, setValue] = useState(initial);
  const onChange = useCallback((e) => {
    const next = e?.target ? e.target.value : e;
    setValue(next);
  }, []);
  const reset = useCallback(() => setValue(initial), [initial]);
  return { value, onChange, setValue, reset };
} 