// webapp/src/auth/useAuth.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../api/auth';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        if (api.getToken()) {
          const u = await api.me();
          if (!cancelled) setUser(u);
        }
      } catch {
        api.logout();
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    async doLogin(email, password) {
      await api.login({ email, password });
      const u = await api.me();
      setUser(u);
    },
    async doRegister(name, email, password, password_confirmation, role) {
      await api.register({ name, email, password, password_confirmation, role });
      const u = await api.me();
      setUser(u);
    },
    doLogout() {
      api.logout();
      setUser(null);
    },
  }), [user, ready]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);