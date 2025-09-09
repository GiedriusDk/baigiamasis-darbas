// webapp/src/api/auth.js
const BASE = '/auth/api/auth'; // vieną kartą "auth" čia – OK

const LS_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(LS_KEY);
export const setToken = (t) => t && localStorage.setItem(LS_KEY, t);
export const clearToken = () => localStorage.removeItem(LS_KEY);

async function req(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const r = await fetch(`${BASE}${path}`, { ...options, headers });
  const txt = await r.text();
  let data;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = { message: txt }; }

  if (!r.ok) {
    throw new Error((data && (data.message || data.error)) || `HTTP ${r.status}`);
  }
  return data;
}

export async function register({ name, email, password, password_confirmation, role }) {
  const res = await req('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, password_confirmation, role }), // ← pridėjome role
  });
  if (res?.token) setToken(res.token);
  return res;
}

export async function login({ email, password }) {
  const res = await req('/login', { // ← NE '/auth/login'
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res?.token) setToken(res.token);
  return res;
}

export async function me() {
  return req('/me', { method: 'GET' }); // ← NE '/auth/me'
}

export function logout() { clearToken(); }