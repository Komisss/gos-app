const USERNAME_KEY = 'gos.username';

export type SessionSnapshot = {
  username: string;
};

export function saveSession(username: string) {
  sessionStorage.setItem(USERNAME_KEY, username);
}

export function readSession(): SessionSnapshot | null {
  const username = sessionStorage.getItem(USERNAME_KEY);

  if (!username) {
    return null;
  }

  return { username };
}

export function clearSession() {
  sessionStorage.removeItem(USERNAME_KEY);
}
