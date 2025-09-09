// webapp/src/api/profiles.js
import { getToken } from './auth';

const BASE = '/profiles/api';

function authHeaders(extra = {}) {
  const t = getToken();
  return {
    Accept: 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

/* ===================== Coach profile ===================== */

export function getCoachProfile() {
  return request('/coach/profile', { headers: authHeaders() });
}

export function saveCoachProfile(payload) {
  return request('/coach/profile', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

// Jei įkelsi avatarą/nuotrauką (multipart/form-data)
export function uploadCoachAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  return request('/coach/upload', {
    method: 'POST',
    headers: authHeaders(), // NESTATYK 'Content-Type' rankiniu būdu su FormData!
    body: fd,
  });
}

/* ===================== Coach exercises ===================== */

export function listCoachExercises() {
  return request('/coach/exercises', { headers: authHeaders() });
}

export function createCoachExercise(payload) {
  // payload: { title, description?, video_url?, image_url? }
  return request('/coach/exercises', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteCoachExercise(id) {
  return request(`/coach/exercises/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

// (nebūtina, bet jei prireiks)
// export function updateCoachExercise(id, payload) {
//   return request(`/coach/exercises/${id}`, {
//     method: 'PUT',
//     headers: authHeaders({ 'Content-Type': 'application/json' }),
//     body: JSON.stringify(payload),
//   });
// }