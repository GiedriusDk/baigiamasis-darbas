// webapp/src/api/plans.js
import { getToken } from './auth';

const COACH_BASE = '/api/coach-plans';   // privata (builder)
const PUBLIC_BASE = '/api/coach-plans/public'; // vieša (viewer)

function authHeaders(extra = {}) {
  const t = getToken ? getToken() : localStorage.getItem('auth_token');
  return { Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

async function request(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, { method, headers, body, credentials: 'include' });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

// === Coach-side (auth) ===
export function getPlanByProduct(productId) {
  return request(`${COACH_BASE}/products/${productId}/plan`, { headers: authHeaders() });
}
export function createWeek(planId, payload) {
  return request(`${COACH_BASE}/plans/${planId}/weeks`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}
export function deleteWeek(weekId) {
  return request(`${COACH_BASE}/weeks/${weekId}`, { method: 'DELETE', headers: authHeaders() });
}
export function createDay(planId, payload) {
  return request(`${COACH_BASE}/plans/${planId}/days`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}
export function deleteDay(dayId) {
  return request(`${COACH_BASE}/days/${dayId}`, { method: 'DELETE', headers: authHeaders() });
}
export function getDayExercises(productId, dayId) {
  return request(`${COACH_BASE}/products/${productId}/days/${dayId}/exercises`, { headers: authHeaders() });
}
export function setDayExercises(productId, dayId, items) {
  return request(`${COACH_BASE}/products/${productId}/days/${dayId}/exercises`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data: items }),
  });
}

// === Public-side (no auth) ===
export function getPublicPlan(productId) {
  return request(`${PUBLIC_BASE}/products/${productId}/plan`, { headers: { Accept: 'application/json' } });
}
export function getPublicDayExercises(productId, dayId) {
  return request(`${PUBLIC_BASE}/products/${productId}/days/${dayId}/exercises`, { headers: { Accept: 'application/json' } });
}