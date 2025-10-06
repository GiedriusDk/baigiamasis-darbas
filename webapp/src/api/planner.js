// webapp/src/api/planner.js
import { getToken } from "./auth";
const BASE = "/api/planner";

function authHeaders(extra = {}) {
  const t = getToken ? getToken() : localStorage.getItem("auth_token");
  return {
    Accept: "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

// universalus fetch'as: jei ne JSON, parodo tekstą
async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const raw = await res.text(); // pirmiausia raw tekstas
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw }; }
  if (!res.ok) {
    // parodyk prasmingą klaidą
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function createPlan(payload) {
  return request(`/plans`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function getLatestPlan() {
  return request(`/plans/latest`, { headers: authHeaders() });
}

export function getPlan(id) {
  return request(`/plans/${id}`, { headers: authHeaders() });
}


export async function getAlternatives(workoutId, order, { equipment, limit = 24 } = {}) {
  const u = new URL(`/api/planner/workouts/${workoutId}/exercises/${order}/alternatives`, window.location.origin);
  if (equipment) u.searchParams.set('equipment', equipment);
  u.searchParams.set('limit', String(limit));
  const r = await fetch(u, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { data: [], current: {} }
}

export async function swapExercise(workoutId, order, exerciseId) {
  const r = await fetch(`/api/planner/workouts/${workoutId}/exercises/${order}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ exercise_id: exerciseId }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function searchExercises({ q, equipment, muscles, page = 1, per_page = 30 }) {
  const u = new URL(`/api/planner/exercises/search`, window.location.origin);
  if (q) u.searchParams.set('q', q);
  if (equipment) u.searchParams.set('equipment', equipment);
  if (muscles) u.searchParams.set('muscles', muscles);
  u.searchParams.set('page', page);
  u.searchParams.set('per_page', per_page);
  const r = await fetch(u, { credentials: 'include' });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { data: [] }
}