// webapp/src/api/admin.js
import { getToken } from './auth';

const ADMIN_BASE = '/api/auth/admin';

function authHeaders(extra = {}) {
  const t = getToken ? getToken() : localStorage.getItem('auth_token');
  const headers = { Accept: 'application/json', ...extra };
  if (t) headers.Authorization = t.startsWith('Bearer ') ? t : `Bearer ${t}`;
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  const text = await res.text().catch(() => '');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

/*USERS*/

export function adminListUsers() {
  return request(`${ADMIN_BASE}/users`, {
    headers: authHeaders(),
  });
}

export function adminGetUser(id) {
  return request(`${ADMIN_BASE}/users/${id}`, {
    headers: authHeaders(),
  });
}

export function adminUpdateUser(id, payload) {
  return request(`${ADMIN_BASE}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function adminDeleteUser(id) {
  return request(`${ADMIN_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/*PROFILES*/

export function adminListProfiles() {
  return request(`${ADMIN_BASE}/profiles`, {
    headers: authHeaders(),
  });
}

export function adminGetProfile(id) {
  return request(`${ADMIN_BASE}/profiles/${id}`, {
    headers: authHeaders(),
  });
}

export function adminUpdateProfile(id, payload) {
  return request(`${ADMIN_BASE}/profiles/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function adminDeleteProfile(id) {
  return request(`${ADMIN_BASE}/profiles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/*COACH PROFILES*/

export function adminListCoaches() {
  return request(`${ADMIN_BASE}/coaches`, {
    headers: authHeaders(),
  });
}

export function adminGetCoach(id) {
  return request(`${ADMIN_BASE}/coaches/${id}`, {
    headers: authHeaders(),
  });
}

export function adminUpdateCoach(id, payload) {
  return request(`${ADMIN_BASE}/coaches/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function adminDeleteCoach(id) {
  return request(`${ADMIN_BASE}/coaches/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/*COACH EXERCISES*/

export function adminListExercises() {
  return request(`${ADMIN_BASE}/exercises`, {
    headers: authHeaders(),
  });
}

export function adminGetExercise(id) {
  return request(`${ADMIN_BASE}/exercises/${id}`, {
    headers: authHeaders(),
  });
}

export function adminUpdateExercise(id, payload) {
  return request(`${ADMIN_BASE}/exercises/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function adminDeleteExercise(id) {
  return request(`${ADMIN_BASE}/exercises/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}