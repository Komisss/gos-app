import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshAccessToken, requestAuthTokens } from '@/shared/api/auth';
import { clearSession, readSession, saveSession, type SessionSnapshot } from './tokenStorage';

type LoginPayload = {
  username: string;
  password: string;
};

type AuthContextValue = {
  session: SessionSnapshot | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionSnapshot | null>(() => readSession());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      const currentSession = readSession();

      if (!currentSession) {
        if (isActive) {
          setSession(null);
          setIsInitializing(false);
        }
        return;
      }

      try {
        await refreshAccessToken();

        if (isActive) {
          setSession(currentSession);
        }
      } catch {
        clearSession();

        if (isActive) {
          setSession(null);
        }
      } finally {
        if (isActive) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const login = useCallback(async ({ username, password }: LoginPayload) => {
    const authUser = await requestAuthTokens({ username, password });
    const nextSession: SessionSnapshot = {
      userId: authUser.user_id,
      username: authUser.username,
      fullName: authUser.full_name || authUser.username,
      role: authUser.role,
    };

    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, session],
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
