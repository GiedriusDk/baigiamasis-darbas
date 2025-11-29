
const BASE = 'http://localhost:8080/api/auth';

const LS_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(LS_KEY);
export const setToken = (t) => t && localStorage.setItem(LS_KEY, t);
export const clearToken = () => localStorage.removeItem(LS_KEY);

function pickFirstError(errors) {
  if (!errors || typeof errors !== 'object') return null;
  for (const k of Object.keys(errors)) {
    const v = Array.isArray(errors[k]) ? errors[k][0] : errors[k];
    if (v) return v;
  }
  return null;
}

async function req(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();

  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function register({ first_name, last_name, email, password, password_confirmation, role }) {
  const out = await req('/register', {
    method: 'POST',
    body: JSON.stringify({ first_name, last_name, email, password, password_confirmation, role }),
  });
  if (out?.token) setToken(out.token);
  return out;
}

export async function login({ email, password }) {
  const out = await req('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (out?.token) setToken(out.token);
  return out;
}

export async function me() {
  return req('/me', { method: 'GET' });
}

export async function updateMe(payload) {
  return req('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateEmail({ email, password }) {
  return req('/me/email', {
    method: 'PUT',
    body: JSON.stringify({ email, password }),
  });
}

export async function updatePassword({ current_password, password, password_confirmation }) {
  return req('/me/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password, password, password_confirmation }),
  });
}

export function logout() {
  clearToken();
}

export async function getPublicUser(id) {
  const res = await fetch(`${BASE}/public/users/${id}`, {
    headers: { Accept: 'application/json' },
    credentials: 'omit',
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export async function adminListUsers() {
  return req('/admin/users', { method: 'GET' });
}

export async function adminGetUser(id) {
  return req(`/admin/users/${id}`, { method: 'GET' });
}

export async function adminUpdateUser(id, payload) {
  return req(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteUser(id) {
  return req(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export const adminListAuthUsers = adminListUsers;