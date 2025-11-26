
import { getToken } from "./auth";

const BASE = "/catalog/api";

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
export async function searchCatalogExercises(params = {}) {
  return getExercises(params);
}



async function catalogAdminRequest(
  path,
  { method = "GET", headers = {}, body } = {}
) {
  const token = getToken ? getToken() : localStorage.getItem("auth_token");

  const finalHeaders = {
    Accept: "application/json",
    ...(token
      ? {
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        }
      : {}),
    ...headers,
  };

  const res = await fetch(`/api/catalog/admin${path}`, {
    method,
    headers: finalHeaders,
    body,
    credentials: "include",
  });

  const text = await res.text();
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

/* ------------------- EXERCISES ------------------- */

// čia jau su pagination: page + perPage + optional q
export function adminListExercises({ page = 1, perPage = 50, q = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  if (q) params.set("q", q);

  return catalogAdminRequest(`/exercises?${params.toString()}`);
}

export function adminUpdateExercise(id, payload) {
  return catalogAdminRequest(`/exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteExercise(id) {
  return catalogAdminRequest(`/exercises/${id}`, {
    method: "DELETE",
  });
}

/* ------------------- EQUIPMENTS ------------------- */

export function adminListEquipments() {
  return catalogAdminRequest("/equipments");
}

export function adminCreateEquipment(payload) {
  return catalogAdminRequest("/equipments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminUpdateEquipment(id, payload) {
  return catalogAdminRequest(`/equipments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteEquipment(id) {
  return catalogAdminRequest(`/equipments/${id}`, {
    method: "DELETE",
  });
}

/* ------------------- MUSCLES ------------------- */

export function adminListMuscles() {
  return catalogAdminRequest("/muscles");
}

export function adminCreateMuscle(payload) {
  return catalogAdminRequest("/muscles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminUpdateMuscle(id, payload) {
  return catalogAdminRequest(`/muscles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteMuscle(id) {
  return catalogAdminRequest(`/muscles/${id}`, {
    method: "DELETE",
  });
}