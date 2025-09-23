import { useCallback, useState } from 'react';

export default function useCheckbox(initial = false) {
  const [checked, setChecked] = useState(Boolean(initial));
  const onChange = useCallback((next) => {
    setChecked(Boolean(next?.target ? next.target.checked : next));
  }, []);
  const toggle = useCallback(() => setChecked(c => !c), []);
  return { checked, setChecked, onChange, toggle };
} 