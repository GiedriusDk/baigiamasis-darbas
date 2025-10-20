import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/auth';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await api.me();
        setUser(u);
      } catch (_) {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function doLogin({ email, password }) {
    const res = await api.login({ email, password });
    setUser(res.user ?? null);
    return res;
  }

  async function doRegister(payload) {
    const res = await api.register(payload);
    if (res?.user) setUser(res.user);
    else {
      try {
        const u = await api.me();
        setUser(u ?? null);
      } catch {
        setUser(null);
      }
    }
    return res;
  }

  function doLogout() {
    api.logout();
    setUser(null);
  }

  async function refreshMe() {
    try {
      const u = await api.me();
      setUser(u);
    } catch (_) {
      setUser(null);
    }
  }

  return (
    <AuthCtx.Provider value={{ ready, user, setUser, doLogin, doRegister, doLogout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}