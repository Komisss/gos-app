export function toApiDateTime(value: Date) {
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function parseApiDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toDateInputValue(value?: Date) {
  if (!value) {
    return '';
  }

  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

export function toTimeInputValue(value?: Date) {
  if (!value) {
    return '00:00';
  }

  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(11, 16);
}
