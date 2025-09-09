// webapp/src/api.js

const BASE = '/catalog/api';

/** Paprastas fetch su klaidų patikra */
async function request(url) {
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) {
    // Pabandome perskaityti klaidos tekstą, kad pranešimas būtų aiškesnis
    let msg = `HTTP ${r.status}`;
    try {
      const t = await r.text();
      if (t) msg += ` – ${t}`;
    } catch {}
    throw new Error(msg);
  }
  return r.json();
}

/** Ping mikroservisą */
export async function pingCatalog() {
  return request(`${BASE}/health`);
}

/** Gauti filtrų sąrašus (equipments, muscles) */
export async function getFilters() {
  return request(`${BASE}/filters`);
}

/**
 * Gauti pratimų sąrašą su puslapiavimu ir filtrais.
 * params gali būti:
 *   - page, per_page, q
 *   - equipment: string | string[]   (CSV)
 *   - muscles:   string | string[]   (CSV)
 */
export async function getExercises(params = {}) {
  const url = new URL(`${BASE}/exercises`, window.location.origin);

  // leidžiami raktai – svarbu, kad čia būtų "muscles"
  const allowed = ['page', 'per_page', 'q', 'equipment', 'muscles'];

  // masyvams leidžiam CSV formatą
  const toCsv = (v) => Array.isArray(v) ? v.join(',') : v;

  for (const k of allowed) {
    const val = params[k];
    if (
      val != null &&
      val !== '' &&
      !(Array.isArray(val) && val.length === 0)
    ) {
      url.searchParams.set(k, toCsv(val));
    }
  }

  return request(url);
}