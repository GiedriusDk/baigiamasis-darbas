import { getToken } from './auth';

const CHAT_BASE     = '/api/chat';
const PROFILES_BASE = '/api/profiles/coach/public';
const USERS_PUBLIC  = '/api/profiles/user/public'; 

let CHAT_DEBUG = false;
export function setChatDebug(on = true) { CHAT_DEBUG = !!on; }
function log(...args) { if (CHAT_DEBUG) console.log(...args); }

function normToken(t) {
  if (!t) return null;
  return t.startsWith('Bearer ') ? t : `Bearer ${t}`;
}

function resolveToken() {
  return (typeof getToken === 'function' ? getToken() : null) || localStorage.getItem('auth_token') || '';
}

function authHeaders(extra = {}) {
  const t = resolveToken();
  return { Accept: 'application/json', ...(t ? { Authorization: normToken(t) } : {}), ...extra };
}

async function request(url, { method = 'GET', headers = {}, body } = {}) {
  log('🟦 FETCH:', method || 'GET', url);
  if (body) log('🟦 BODY:', body);
  const res  = await fetch(url, { method, headers, body, credentials: 'include' });
  const text = await res.text().catch(() => '');
  log('🟦 STATUS:', res.status, res.statusText);

  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getCoachPublicProfile(coachProfileId) {
  return request(`${PROFILES_BASE}/${coachProfileId}`, {
    headers: { Accept: 'application/json' },
  });
}

export function getUserPublicProfile(userId) {
  return request(`${USERS_PUBLIC}/${userId}`, {
    headers: { Accept: 'application/json' },
  });
}

export async function listConversations() {
  const r = await fetch('/api/chat/conversations', {
    method: 'GET',
    headers: authHeaders({ Accept: 'application/json' }),
    credentials: 'include',
  });
  if (!r.ok) throw new Error('load convos failed');
  return await r.json();
}

export async function ensureConversation(coachId) {
  const r = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ coach_id: coachId }),
  });
  if (!r.ok) throw new Error('ensure failed');
  return await r.json();
}

export function getMessages(conversationId, { perPage = 50, page = 1 } = {}) {
  const qp = new URLSearchParams({ per_page: String(perPage), page: String(page) }).toString();
  return request(`${CHAT_BASE}/conversations/${conversationId}/messages?${qp}`, {
    headers: authHeaders(),
  });
}

export function sendMessage(conversationId, body) {
  return request(`${CHAT_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ body }),
  });
}

export function presenceTouch() {
  return request('/api/chat/presence/touch', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
}

export async function getPresenceStatus(ids = []) {
  if (!ids.length) return {};
  const q = ids.join(',');
  const res = await request(
    `${CHAT_BASE}/presence/status?ids=${encodeURIComponent(q)}`,
    { headers: authHeaders({ Accept: 'application/json' }) }
  );
  const map = {};
  (res?.data || []).forEach(r => { map[Number(r.user_id)] = r; });
  return map;
}
