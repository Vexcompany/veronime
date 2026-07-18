// src/utils/api.js — Client API veronime (sumber: AnibiPlay via /api/*)
const BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch(route, params = {}) {
  const qs = new URLSearchParams({ route });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const res = await fetch(`${BASE}/api?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Homepage: semua sections (anime, manga, novel) =====
export const fetchHome = () => apiFetch('home');

// ===== Detail anime + semua episode =====
export const fetchDetail = (slug) => apiFetch('detail', { slug });

// ===== Detail episode: mirror stream embed + download + semua episode =====
export const fetchEpisode = (slug, ep) => apiFetch('episode', { slug, ep });

// ===== Search anime & manga & novel =====
export const fetchSearch = (q) => apiFetch('search', { q });

// ===== Explore katalog paginated (page/type/status/sort/search/genres) =====
export const fetchExplore = ({ page = 1, type = '', status = '', sort = '', search = '', genres = '' } = {}) =>
  apiFetch('explore', { page, type, status, sort, search, genres });

// ===== Daftar genre untuk filter =====
export const fetchGenres = () => apiFetch('genres');

// ===== Global proxy (gambar / video) =====
export const proxied = (url) =>
  url ? `${BASE}/api?route=proxy&url=${encodeURIComponent(url)}` : '';

// Helper: url eksternal AnibiPlay untuk konten non-anime (manga/novel)
export const externalUrl = (item) =>
  item?.url?.startsWith('http') ? item.url : `https://anibiplay.net${item?.url || ''}`;

// Helper: apakah stream bisa dimainkan di <video> (direct file) atau butuh iframe
export const isDirectStream = (stream) =>
  stream?.kind === 'direct' || /\.(mp4|webm|m3u8|mkv|mov|ts)(\?|#|$)/i.test(stream?.url || '');
