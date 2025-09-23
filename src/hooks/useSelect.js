import { useCallback, useState } from 'react';

export default function useSelect(initial = '') {
  const [value, setValue] = useState(initial);
  const onChange = useCallback((e) => setValue(e?.target ? e.target.value : e), []);
  return { value, setValue, onChange };
} 