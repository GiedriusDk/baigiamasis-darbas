// webapp/src/auth/useAuth.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/auth'; // turi turėti login, logout, me ir t.t.

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  // Paleidžiant app – užkraunam esamą user
  useEffect(() => {
    (async () => {
      try {
        const u = await api.me(); // GET /api/auth/me
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
    setUser(res.user); // login grąžina { token, user }
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
    <AuthCtx.Provider value={{ ready, user, setUser, doLogin, doLogout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}