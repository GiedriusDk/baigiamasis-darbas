// webapp/src/api.js
const BASE = '/catalog/api';

async function request(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const raw = await r.text();

  let json;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    const msg = `Non-JSON response${!r.ok ? ` (HTTP ${r.status})` : ''}`;
    throw new Error(`${msg}: ${raw.slice(0, 200)}…`);
  }

  if (!r.ok) {
    const msg = json?.message || `HTTP ${r.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function getFilters() {
  return request(`${BASE}/filters`);
}

export async function getExercises(params = {}) {
  const url = new URL(`${BASE}/exercises`, window.location.origin);
  const allowed = ['page', 'per_page', 'q', 'equipment', 'muscles'];
  const toCsv = (v) => (Array.isArray(v) ? v.join(',') : v);

  for (const k of allowed) {
    const val = params[k];
    if (val != null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      url.searchParams.set(k, toCsv(val));
    }
  }

  return request(url);
}

export async function getExerciseById(id) {
  return request(`${BASE}/exercises/${id}`);
}