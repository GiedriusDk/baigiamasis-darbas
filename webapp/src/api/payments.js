import { getToken } from './auth';

const BASE = '/api/payments';
const COACH_PLANS_PUBLIC = '/api/coach-plans/public';

function authHeaders(extra = {}) {
  const t = getToken ? getToken() : localStorage.getItem('auth_token');
  return { Accept: 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${BASE}${path}`, { method, headers, body, credentials: 'include' });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export function listProducts() {
  return request('/products', { headers: authHeaders() });
}

export function myProducts() {
  return request('/products/mine', { headers: authHeaders() });
}

export function createProduct(payload) {
  return request('/products', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function updateProduct(id, payload) {
  return request(`/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
}

export function archiveProduct(id) {
  return request(`/products/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export function reorderProducts(ids) {
  return request('/products/reorder', {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ids }),
  });
}

export function createOrder(productId, quantity = 1) {
  return request('/orders', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export function getOrder(id) {
  return request(`/orders/${id}`, { headers: authHeaders() });
}

export function checkout(orderId) {
  return request(`/checkout/${orderId}`, { method: 'POST', headers: authHeaders() });
}

export function confirm(orderId, sessionId) {
  return request(
    `/confirm?order=${encodeURIComponent(orderId)}&session=${encodeURIComponent(sessionId)}`,
    { headers: authHeaders() }
  );
}

export function access(orderId) {
  return request(`/orders/${orderId}/access`, { headers: authHeaders() });
}

export function getProductExercises(productId) {
  return request(`/products/${productId}/exercises`, { headers: authHeaders() });
}

export function setProductExercises(productId, ids) {
  return request(`/products/${productId}/exercises`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ids }),
  });
}

export async function getProductExerciseIdsPublic(productId) {
  const planRes = await fetch(
    `${COACH_PLANS_PUBLIC}/products/${productId}/plan`,
    { headers: { Accept: 'application/json' }, credentials: 'include' }
  );

  if (planRes.status === 404) {
    return [];
  }

  const planText = await planRes.text();
  let plan;
  try {
    plan = planText ? JSON.parse(planText) : null;
  } catch {
    plan = {};
  }

  if (!planRes.ok) throw new Error(plan?.message || `HTTP ${planRes.status}`);

  const days = Array.isArray(plan?.days)
    ? plan.days
    : Array.isArray(plan?.data?.days)
    ? plan.data.days
    : [];

  const ids = new Set();

  for (const d of days) {
    const dayId = Number(d?.id);
    if (!dayId) continue;

    const r = await fetch(
      `${COACH_PLANS_PUBLIC}/products/${productId}/days/${dayId}/exercises`,
      { headers: { Accept: 'application/json' }, credentials: 'include' }
    );

    if (r.status === 404) continue;

    const t = await r.text();
    let data;
    try {
      data = t ? JSON.parse(t) : null;
    } catch {
      data = {};
    }

    if (!r.ok) throw new Error(data?.message || `HTTP ${r.status}`);

    const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    for (const it of items) {
      if (it?.exercise_id) ids.add(Number(it.exercise_id));
    }
  }

  return Array.from(ids);
}

export async function getMyAccess() {
  const res = await fetch(`${BASE}/me/access`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  if (res.status === 401) {
    return { product_ids: [], exercise_ids: [] };
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

  return {
    product_ids: Array.isArray(data?.product_ids) ? data.product_ids.map(Number) : [],
    exercise_ids: Array.isArray(data?.exercise_ids) ? data.exercise_ids.map(Number) : [],
  };
}

export async function ownedCoaches() {
  const r = await fetch('/api/payments/internal/owned-coaches', {
    headers: authHeaders(),
    credentials: 'include',
  });
  if (!r.ok) throw new Error('owned-coaches failed');
  return await r.json();
}


// --- ADMIN PAYMENTS API (orders moderation) ---

const PAYMENTS_ADMIN_BASE = '/api/payments/admin';

async function adminPaymentsRequest(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${PAYMENTS_ADMIN_BASE}${path}`, {
    method,
    headers: authHeaders(headers),
    body,
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export function adminListOrders() {
  return adminPaymentsRequest('/orders');
}

export function adminGetOrder(id) {
  return adminPaymentsRequest(`/orders/${id}`);
}

export function adminUpdateOrder(id, payload) {
  return adminPaymentsRequest(`/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}


export function adminListProducts() {
  return adminPaymentsRequest('/products');
}


export function adminUpdateProduct(id, payload) {
  return adminPaymentsRequest(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function adminDeleteProduct(id) {
  return adminPaymentsRequest(`/products/${id}`, {
    method: 'DELETE',
  });
}