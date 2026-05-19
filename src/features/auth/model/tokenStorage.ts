import type { AuthUserRole } from '@/shared/api/auth';

const SESSION_KEY = 'gos.session';
const USERNAME_KEY = 'gos.username';

export type SessionSnapshot = {
  userId: number | null;
  username: string;
  fullName: string;
  role: AuthUserRole | null;
};

export function saveSession(session: SessionSnapshot) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(USERNAME_KEY, session.username);
}

export function readSession(): SessionSnapshot | null {
  migrateSessionStorage();

  const rawSession = localStorage.getItem(SESSION_KEY);

  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as SessionSnapshot;

      if (session.username) {
        return {
          userId: session.userId ?? null,
          username: session.username,
          fullName: session.fullName || session.username,
          role: session.role ?? null,
        };
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  const username = localStorage.getItem(USERNAME_KEY);
  if (!username) {
    return null;
  }

  return {
    userId: null,
    username,
    fullName: username,
    role: null,
  };
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USERNAME_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
}

function migrateSessionStorage() {
  const session = sessionStorage.getItem(SESSION_KEY);
  const username = sessionStorage.getItem(USERNAME_KEY);

  if (session && !localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, session);
  }

  if (username && !localStorage.getItem(USERNAME_KEY)) {
    localStorage.setItem(USERNAME_KEY, username);
  }
}
