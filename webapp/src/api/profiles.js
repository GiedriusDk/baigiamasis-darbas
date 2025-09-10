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
  // PUT profiliui
  return request('/coach/profile', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function uploadCoachAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  return request('/coach/upload', {
    method: 'POST',
    headers: authHeaders(), // NENUSTATYK 'Content-Type' ranka!
    body: fd,
  });
}

/* ===================== Coach exercises ===================== */

export function listCoachExercises() {
  return request('/coach/exercises', { headers: authHeaders() });
}

export function createCoachExercise(payload, file) {
  // jei yra failas – multipart; jei ne – JSON
  if (file) {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.description)     fd.append('description', payload.description);
    if (payload.equipment)       fd.append('equipment', payload.equipment);
    if (payload.primary_muscle)  fd.append('primary_muscle', payload.primary_muscle);
    if (payload.difficulty)      fd.append('difficulty', payload.difficulty);
    if (Array.isArray(payload.tags)) {
      payload.tags.forEach((t, i) => fd.append(`tags[${i}]`, t));
    }
    fd.append('media', file);
    return request('/coach/exercises', {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
  }

  return request('/coach/exercises', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function updateCoachExercise(id, payload, file) {
  if (file) {
    const fd = new FormData();
    if (payload.title)           fd.append('title', payload.title);
    if (payload.description)     fd.append('description', payload.description);
    if (payload.equipment)       fd.append('equipment', payload.equipment);
    if (payload.primary_muscle)  fd.append('primary_muscle', payload.primary_muscle);
    if (payload.difficulty)      fd.append('difficulty', payload.difficulty);
    if (Array.isArray(payload.tags)) {
      payload.tags.forEach((t, i) => fd.append(`tags[${i}]`, t));
    }
    fd.append('media', file);
    return request(`/coach/exercises/${id}`, {
      method: 'POST', // kaip pas tave routes – update per POST
      headers: authHeaders(),
      body: fd,
    });
  }

  // jei norim nuimti media – leisk per JSON perduot { media_url: '' }
  return request(`/coach/exercises/${id}`, {
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
export async function reorderCoachExercises(ids) {
  return request('/coach/exercises/reorder', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ order: ids }),
  });
}