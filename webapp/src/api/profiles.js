
import { getToken } from './auth';

const BASE = '/api/profiles';



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
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

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

export function uploadCoachAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  return request('/coach/upload', { method: 'POST', headers: authHeaders(), body: fd });
}

export function listCoachExercises(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/coach/exercises${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function createCoachExercise(payload, file) {
  if (file) {
    const fd = new FormData();
    fd.append('title', payload.title);
    if (payload.description)     fd.append('description', payload.description);
    if (payload.equipment)       fd.append('equipment', payload.equipment);
    if (payload.primary_muscle)  fd.append('primary_muscle', payload.primary_muscle);
    if (payload.difficulty)      fd.append('difficulty', payload.difficulty);
    if (Array.isArray(payload.tags)) payload.tags.forEach((t, i) => fd.append(`tags[${i}]`, t));
    fd.append('media', file);
    return request('/coach/exercises', { method: 'POST', headers: authHeaders(), body: fd });
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
    if (Array.isArray(payload.tags)) payload.tags.forEach((t, i) => fd.append(`tags[${i}]`, t));
    fd.append('media', file);
    return request(`/coach/exercises/${id}`, { method: 'POST', headers: authHeaders(), body: fd });
  }
  return request(`/coach/exercises/${id}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteCoachExercise(id) {
  return request(`/coach/exercises/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export function reorderCoachExercises(ids) {
  return request('/coach/exercises/reorder', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ order: ids }),
  });
}

export function getUserProfile() {
  return request('/user/profile', { headers: authHeaders() });
}

export function saveUserProfile(payload) {
  return request('/user/profile', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function uploadUserAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  return request('/user/upload', { method: 'POST', headers: authHeaders(), body: fd });
}

export function getPublicCoaches(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/coach/public${qs ? `?${qs}` : ''}`, { headers: { Accept: 'application/json' } });
}

export function getPublicCoach(id) {
  return request(`/coach/public/${id}`, { headers: { Accept: 'application/json' } });
}

export function getPublicCoachExercises(id) {
  return request(`/coach/public/${id}/exercises`, { headers: { Accept: 'application/json' } });
}

export function listSharedExercises(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/coach/exercises/shared${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function getSharedExerciseById(id) {
  return request(`/coach/exercises/shared/${id}`, { headers: authHeaders() });
}

export function importExerciseFromCatalog(catalog_id) {
  return request('/coach/exercises/import', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ catalog_id }),
  }).then(d => d?.data ?? d);
}

export async function updateProfileDefaults(payload) {
  const res = await fetch(`${BASE}/user/profile`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export async function getClientProfileForCoach(userId) {
  const res = await fetch(`/api/profiles/coach/clients/${userId}`, {
    method: "GET",
    headers: authHeaders({ Accept: "application/json" }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    throw new Error(data?.message || "Failed to load client profile");
  }

  return res.json();
}


const ADMIN_BASE = "/api/profiles/admin";

async function adminRequest(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${ADMIN_BASE}${path}`, {
    method,
    headers: authHeaders(headers),
    body,
    credentials: "include",
  });

  const text = await res.text().catch(() => "");
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  return data;
}

export function adminListProfiles() {
  return adminRequest("/users", { method: "GET" });
}

export function adminGetUserProfile(id) {
  return adminRequest(`/users/${id}`, { method: "GET" });
}

export function adminUpdateProfile(userId, payload) {
  return adminRequest(`/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteProfile(userId) {
  return adminRequest(`/users/${userId}`, {
    method: "DELETE",
  });
}


export function adminListCoachProfiles() {
  return adminRequest("/coaches", {});
}

export function adminUpdateCoachProfile(id, payload) {
  return adminRequest(`/coaches/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function adminDeleteCoachProfile(id) {
  return adminRequest(`/coaches/${id}`, {
    method: "DELETE",
  });
}


export function adminListCoachExercises() {
  return adminRequest("/exercises");
}


export function adminUpdateCoachExercise(id, payload) {
  return adminRequest(`/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

export function adminDeleteCoachExercise(id) {
  return adminRequest(`/exercises/${id}`, {
    method: "DELETE",
  });
}

export async function getMyAnthropometrics() {
  const res = await getUserProfile();
  const p = res?.data ?? res;

  return {
    heightCm: p?.height_cm != null ? Number(p.height_cm) : null,
    weightKg: p?.weight_kg != null ? Number(p.weight_kg) : null,
  };
}