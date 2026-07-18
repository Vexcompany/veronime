// api/_lib/proxypool.js — Auto free-proxy pool anti-403.
// Ambil daftar proxy gratis (https-capable), tes paralel ke anibiplay,
// pakai yang pertama jalan. Explicit env proxy selalu menang.
// Nonaktifkan dengan env PROXY_POOL=0.
const axios = require('axios');

const POOL_TTL = 30 * 60 * 1000;   // 30 menit — refresh daftar proxy
const ACTIVE_TTL = 15 * 60 * 1000; // 15 menit — re-verify proxy terpilih
const POOL_LIMIT = 60;

let pool = [];
let poolExp = 0;
let activeProxy = null;
let activeExp = 0;

const SOURCES = [
  {
    url: 'https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc&protocols=https',
    parse: (data) => (Array.isArray(data?.data) ? data.data : []).map((p) => `${p.ip}:${p.port}`),
  },
  {
    url: 'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&proxy_format=protocolipport&format=text&timeout=3000',
    parse: (data) =>
      String(data)
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /^https?:\/\//i.test(l))
        .map((l) => l.replace(/^https?:\/\//i, '')),
  },
];

const BLOCK_HINT = /just a moment|attention required|cf-chl|cloudflare ray id|access denied/i;

function isEnabled() {
  return process.env.PROXY_POOL !== '0';
}

function status() {
  return {
    enabled: isEnabled(),
    cached: Boolean(activeProxy && Date.now() < activeExp),
    poolSize: pool.length,
  };
}

async function refreshPool() {
  const out = new Set();
  const results = await Promise.allSettled(
    SOURCES.map((s) => axios.get(s.url, { timeout: 6000 }))
  );
  for (let i = 0; i < SOURCES.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      try {
        SOURCES[i].parse(r.value.data).forEach((hp) => out.add(hp));
      } catch { /* ignore parse error */ }
    }
  }
  pool = [...out].slice(0, POOL_LIMIT);
  poolExp = Date.now() + POOL_TTL;
  return pool;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseProxy(proxyUrl) {
  try {
    const u = new URL(proxyUrl);
    const pc = {
      protocol: u.protocol.replace(':', '') || 'http',
      host: u.hostname,
      port: parseInt(u.port) || 80,
    };
    if (u.username) pc.auth = { username: decodeURIComponent(u.username), password: decodeURIComponent(u.password || '') };
    return pc;
  } catch {
    return null;
  }
}

/**
 * Cari proxy gratisan yang jalan ke testUrl.
 * Tes paralel sebatch (hemat waktu vs sequential).
 * @param {string} testUrl - URL uji (ideal endpoint JSON ringan milik target)
 * @param {object} headers - header request uji
 */
async function findWorkingProxy(testUrl, headers = {}) {
  if (activeProxy && Date.now() < activeExp) return activeProxy;

  if (!pool.length || Date.now() >= poolExp) await refreshPool();
  const candidates = shuffle(pool).slice(0, 6);
  if (!candidates.length) return null;

  const testOne = async (hp) => {
    const proxy = parseProxy('http://' + hp);
    if (!proxy) throw new Error('bad proxy');
    const r = await axios.get(testUrl, {
      headers,
      timeout: 6500,
      proxy: { ...proxy },
      validateStatus: (s) => s === 200,
      maxRedirects: 3,
    });
    const body = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
    if (!body || body.length < 20 || BLOCK_HINT.test(body.slice(0, 2000))) {
      throw new Error('blocked/empty');
    }
    return hp;
  };

  const results = await Promise.allSettled(candidates.map(testOne));
  const hit = results.find((r) => r.status === 'fulfilled');
  if (hit) {
    activeProxy = 'http://' + hit.value;
    activeExp = Date.now() + ACTIVE_TTL;
    console.log('[proxypool] proxy aktif:', hit.value);
    return activeProxy;
  }
  return null;
}

function markProxyDead(proxyUrl) {
  if (activeProxy === proxyUrl) {
    activeProxy = null;
    activeExp = 0;
  }
}

module.exports = { isEnabled, status, findWorkingProxy, markProxyDead, parseProxy };
