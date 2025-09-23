export function required(message = 'Trường này là bắt buộc') {
  return value => (value == null || value === '' ? message : undefined);
}

export function min(minValue, message) {
  return value => (value != null && String(value).length < minValue ? (message || `Tối thiểu ${minValue} ký tự`) : undefined);
}

export function max(maxValue, message) {
  return value => (value != null && String(value).length > maxValue ? (message || `Tối đa ${maxValue} ký tự`) : undefined);
}

export function pattern(regex, message = 'Định dạng không hợp lệ') {
  return value => (value != null && value !== '' && !regex.test(String(value)) ? message : undefined);
}

export function email(message = 'Email không hợp lệ') {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(re, message);
}

export function custom(validator) {
  return value => validator(value);
} 