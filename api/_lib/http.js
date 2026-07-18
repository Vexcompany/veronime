// api/_lib/http.js — Helper kecil untuk serverless functions veronime.
// CORS headers, error handler, dan in-memory TTL cache (akurat per warm instance).

function setCors(res, extra = {}) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
}

function cacheControl(res, seconds = 300) {
  res.setHeader('Cache-Control', `s-maxage=${seconds}, stale-while-revalidate`);
}

function sendError(res, tag, error, status = 500) {
  console.error(`[${tag}]`, error?.message || error);
  return res.status(status).json({ error: `${tag}: ${error?.message || error}` });
}

// ===== TTL Cache sederhana =====
const store = new Map();

function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.exp) {
    store.delete(key);
    return undefined;
  }
  return hit.val;
}

function cacheSet(key, val, ttlMs) {
  // Batasi ukuran map supaya tidak membengkak di warm instance
  if (store.size > 200) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
  store.set(key, { val, exp: Date.now() + ttlMs });
}

const MIN = 60 * 1000;
const TTL = {
  SEARCH: 5 * MIN,
  EXPLORE: 5 * MIN,
  HOME: 10 * MIN,
  EPISODE: 15 * MIN,
  DETAIL: 30 * MIN,
  GENRES: 6 * 60 * MIN,
};

module.exports = { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL };
