import { useCallback, useState } from 'react';

export default function useRadioGroup(initial = null) {
  const [value, setValue] = useState(initial);
  const onChange = useCallback((next) => setValue(next?.target ? next.target.value : next), []);
  return { value, setValue, onChange };
}
