import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { requestAuthTokens } from '@/shared/api/auth';
import { clearSession, readSession, saveSession, type SessionSnapshot } from './tokenStorage';

type LoginPayload = {
  username: string;
  password: string;
};

type AuthContextValue = {
  session: SessionSnapshot | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionSnapshot | null>(() => readSession());

  const login = useCallback(async ({ username, password }: LoginPayload) => {
    await requestAuthTokens({ username, password });
    saveSession(username);
    setSession({ username });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
