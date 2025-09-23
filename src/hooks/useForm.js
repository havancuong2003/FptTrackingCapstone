import { useCallback, useMemo, useState } from 'react';

export default function useForm({ initialValues = {}, validators = {}, onSubmit } = {}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const runValidators = useCallback((name, value) => {
    const fns = Array.isArray(validators[name]) ? validators[name] : (validators[name] ? [validators[name]] : []);
    for (let i = 0; i < fns.length; i += 1) {
      const err = fns[i](value, values);
      if (err) return err;
    }
    return undefined;
  }, [validators, values]);

  const validateAll = useCallback((nextValues) => {
    const newErrors = {};
    const keys = Object.keys({ ...nextValues });
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const err = runValidators(key, nextValues[key]);
      if (err) newErrors[key] = err;
    }
    return newErrors;
  }, [runValidators]);

  const register = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => {
      const next = e?.target ? e.target.value : e;
      setValues(v => ({ ...v, [name]: next }));
    },
    onBlur: () => {
      setTouched(t => ({ ...t, [name]: true }));
      setErrors(errs => ({ ...errs, [name]: runValidators(name, values[name]) }));
    },
  }), [values, runValidators]);

  const handleSubmit = useCallback((e) => {
    e && e.preventDefault && e.preventDefault();
    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit && onSubmit(values);
    }
  }, [values, validateAll, onSubmit]);

  const setValue = useCallback((name, value) => {
    setValues(v => ({ ...v, [name]: value }));
  }, []);

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
    setTouched({});
    setErrors({});
  }, [initialValues]);

  return useMemo(() => ({ values, errors, touched, register, handleSubmit, setValue, reset }), [values, errors, touched, register, handleSubmit, setValue, reset]);
} 