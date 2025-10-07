
import { getToken } from "./auth";

const BASE = "/api/payments";

function authHeaders(extra = {}) {
  const t = getToken ? getToken() : localStorage.getItem("auth_token");
  return {
    Accept: "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body, credentials: "include" });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export function listProducts() {
  return request("/products", { headers: authHeaders() });
}

export function myProducts() {
  return request("/products/mine", { headers: authHeaders() });
}

export function createProduct(payload) {
  return request("/products", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id, payload) {
  return request(`/products/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export function archiveProduct(id) {
  return request(`/products/${id}`, { method: "DELETE", headers: authHeaders() });
}

export function createOrder(productId, quantity = 1) {
  return request("/orders", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export function getOrder(id) {
  return request(`/orders/${id}`, { headers: authHeaders() });
}

export function checkout(orderId) {
  return request(`/checkout/${orderId}`, { method: "POST", headers: authHeaders() });
}

export function confirm(orderId, sessionId) {
  return request(`/confirm?order=${encodeURIComponent(orderId)}&session=${encodeURIComponent(sessionId)}`, { headers: authHeaders() });
}

export function access(orderId) {
  return request(`/orders/${orderId}/access`, { headers: authHeaders() });
}

export function reorderProducts(ids) {
  return request("/products/reorder", {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ ids }),
  });
}