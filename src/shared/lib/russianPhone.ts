export function formatRussianPhone(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const nationalDigits = digits.startsWith('7') || digits.startsWith('8')
    ? digits.slice(1)
    : digits;

  return `8${nationalDigits.slice(0, 10)}`;
}

export function isCompleteRussianPhone(value: string) {
  return value.replace(/\D/g, '').length === 11;
}
