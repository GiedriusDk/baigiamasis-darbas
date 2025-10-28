// webapp/src/api/planner.js
import { getToken } from "./auth";
const BASE = "/api/planner";

function authHeaders(extra = {}) {
  const t = (typeof getToken === "function" ? getToken() : null) || localStorage.getItem("auth_token");
  return {
    Accept: "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

// universalus fetch'as: jei ne JSON, parodo tekstą
async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const raw = await res.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw }; }
  if (!res.ok) {
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

// --- Žemiau: pridėtas Authorization visur ---

export async function getAlternatives(workoutId, order, { equipment, limit = 24 } = {}) {
  const qs = new URLSearchParams();
  if (equipment) qs.set("equipment", equipment);
  qs.set("limit", String(limit));
  const url = `${BASE}/workouts/${workoutId}/exercises/${order}/alternatives?${qs.toString()}`;
  const r = await fetch(url, { headers: authHeaders() });
  const raw = await r.text();
  if (!r.ok) throw new Error(raw || `HTTP ${r.status}`);
  return raw ? JSON.parse(raw) : { data: [], current: null };
}

export async function swapExercise(workoutId, order, exerciseId) {
  const r = await fetch(`${BASE}/workouts/${workoutId}/exercises/${order}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ exercise_id: exerciseId }),
  });
  const raw = await r.text();
  if (!r.ok) throw new Error(raw || `HTTP ${r.status}`);
  return raw ? JSON.parse(raw) : { ok: true };
}

export async function searchExercises({ q, equipment, muscles, page = 1, per_page = 30 }) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (equipment) qs.set("equipment", equipment);
  if (muscles) qs.set("muscles", muscles);
  qs.set("page", String(page));
  qs.set("per_page", String(per_page));
  const r = await fetch(`${BASE}/exercises/search?${qs.toString()}`, { headers: authHeaders() });
  const raw = await r.text();
  if (!r.ok) throw new Error(raw || `HTTP ${r.status}`);
  return raw ? JSON.parse(raw) : { data: [] };
}