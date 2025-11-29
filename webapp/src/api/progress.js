import { getToken } from './auth';

const BASE = '/api/progress';

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

/* ---------- Metrics ---------- */

export function listMetrics(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/metrics${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function createMetric(payload) {
  return request('/metrics', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function getMetric(id, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/metrics/${id}${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function updateMetric(id, payload) {
  return request(`/metrics/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteMetric(id) {
  return request(`/metrics/${id}`, { method: 'DELETE', headers: authHeaders() });
}

/* ---------- Entries ---------- */

export function listEntries(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/entries${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function createEntry(payload) {
  return request('/entries', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function getEntry(id) {
  return request(`/entries/${id}`, { headers: authHeaders() });
}

export function updateEntry(id, payload) {
  return request(`/entries/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteEntry(id) {
  return request(`/entries/${id}`, { method: 'DELETE', headers: authHeaders() });
}

/* ---------- Photos (progress pictures) ---------- */

export function listEntryPhotos(entryId) {
  return request(`/entries/${entryId}/photos`, { headers: authHeaders() });
}

export function uploadPhoto(entryId, file) {
  const fd = new FormData();
  fd.append('entry_id', String(entryId));
  fd.append('image', file);
  return request('/photos', { method: 'POST', headers: authHeaders(), body: fd });
}

export function deletePhoto(photoId) {
  return request(`/photos/${photoId}`, { method: 'DELETE', headers: authHeaders() });
}


/* ---------- Goals & check-ins ---------- */

export function listGoals(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/goals${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
}

export function createGoal(payload) {
  return request('/goals', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function getGoal(id) {
  return request(`/goals/${id}`, { headers: authHeaders() });
}

export function updateGoal(id, payload) {
  return request(`/goals/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteGoal(id) {
  return request(`/goals/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export function listGoalCheckins(goalId) {
  return request(`/goals/${goalId}/checkins`, { headers: authHeaders() });
}

export function createGoalCheckin(goalId, payload) {
  return request(`/goals/${goalId}/checkins`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function deleteGoalCheckin(goalId, checkinId) {
  return request(`/goals/${goalId}/checkins/${checkinId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/* ---------- Small convenience helpers ---------- */

export async function ensureMetric(slug, attrs = {}) {
  const existing = await listMetrics({ search: slug });
  const found = (existing?.data || []).find((m) => m.slug === slug);
  if (found) return found;
  const created = await createMetric({
    slug,
    name: attrs.name || slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    unit: attrs.unit ?? null,
    kind: attrs.kind || 'numeric',
    is_public: !!attrs.is_public,
  });
  return created?.data ?? created;
}

export async function addEntryBySlug(slug, { value, date, note, source, value_json } = {}) {
  const m = await ensureMetric(slug);
  const payload = {
    metric_id: m.id,
    value: value ?? null,
    value_json: value_json ?? null,
    note: note ?? null,
    recorded_at: date ?? null,
    source: source ?? 'manual',
  };
  const r = await createEntry(payload);
  return r?.data ?? r;
}


async function adminProgressRequest(path, { method = "GET", headers = {}, body } = {}) {
  const token = typeof getToken === "function" ? getToken() : null;

  const finalHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    ...headers,
  };

  const res = await fetch(`/api/progress/admin${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  const text = await res.text().catch(() => "");
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export function adminListProgressGoals() {
  return adminProgressRequest("/progress-goals");
}


export function adminUpdateProgressGoal(id, payload) {
  return adminProgressRequest(`/progress-goals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteProgressGoal(id) {
  return adminProgressRequest(`/progress-goals/${id}`, {
    method: "DELETE",
  });
}

export function adminListProgressEntries() {
  return adminProgressRequest("/progress-entries");
}

export function adminGetProgressEntry(id) {
  return adminProgressRequest(`/progress-entries/${id}`);
}

export function adminUpdateProgressEntry(id, payload) {
  return adminProgressRequest(`/progress-entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteProgressEntry(id) {
  return adminProgressRequest(`/progress-entries/${id}`, { method: "DELETE" });
}

export function adminListProgressMetrics() {
  return request("/metrics", {
    method: "GET",
    headers: authHeaders(),
  });
}