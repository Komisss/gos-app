const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export function getUsernameError(value: string) {
  if (!value.trim()) {
    return 'Логин обязателен.';
  }

  return USERNAME_PATTERN.test(value)
    ? null
    : 'Логин может содержать только латинские буквы, цифры и нижнее подчеркивание.';
}
