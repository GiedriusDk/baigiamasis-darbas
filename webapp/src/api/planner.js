
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

export function listWorkouts(planId) {
  return request(`/plans/${planId}/workouts`, {
    headers: authHeaders(),
  });
}

export function createWorkout(planId, payload) {
  return request(`/plans/${planId}/workouts`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function updateWorkout(workoutId, payload) {
  return request(`/workouts/${workoutId}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function deleteWorkout(workoutId) {
  return request(`/workouts/${workoutId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export function listWorkoutExercises(workoutId) {
  return request(`/workouts/${workoutId}/exercises`, {
    headers: authHeaders(),
  });
}

export function createWorkoutExercise(workoutId, payload) {
  return request(`/workouts/${workoutId}/exercises`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function updateWorkoutExercise(workoutId, workoutExerciseId, payload) {
  return request(`/workouts/${workoutId}/exercises/${workoutExerciseId}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function deleteWorkoutExercise(workoutId, workoutExerciseId) {
  return request(`/workouts/${workoutId}/exercises/${workoutExerciseId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}




const ADMIN_BASE = "/api/planner/admin";

function adminPlannerRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(`${ADMIN_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body || null,
  }).then(async (res) => {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }
    return data;
  });
}

/* Admin workouts */

export function adminListWorkouts() {
  return adminPlannerRequest("/workouts");
}

export function adminGetWorkout(id) {
  return adminPlannerRequest(`/workouts/${id}`);
}

export function adminUpdateWorkout(id, payload) {
  return adminPlannerRequest(`/workouts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminSyncWorkoutExercises(id, items) {
  return adminPlannerRequest(`/workouts/${id}/exercises`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export function adminDeleteWorkout(id) {
  return adminPlannerRequest(`/workouts/${id}`, { method: "DELETE" });
}

/* Admin splits */

export function adminListSplits() {
  return adminPlannerRequest("/splits");
}

export function adminUpdateSplit(id, payload) {
  return adminPlannerRequest(`/splits/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteSplit(id) {
  return adminPlannerRequest(`/splits/${id}`, { method: "DELETE" });
}