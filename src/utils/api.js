// src/utils/api.js — Client API veronime (sumber: AnibiPlay via /api/*)
const BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Homepage: semua sections (anime, manga, novel) =====
export const fetchHome = () => apiFetch('/api/home');

// ===== Detail anime + semua episode =====
export const fetchDetail = (slug) =>
  apiFetch(`/api/detail?slug=${encodeURIComponent(slug)}`);

// ===== Detail episode: mirror stream embed + download + semua episode =====
export const fetchEpisode = (slug, ep) =>
  apiFetch(`/api/episode?slug=${encodeURIComponent(slug)}&ep=${encodeURIComponent(ep)}`);

// ===== Search anime & manga & novel =====
export const fetchSearch = (q) =>
  apiFetch(`/api/search?q=${encodeURIComponent(q)}`);

// ===== Explore katalog paginated (page/type/status/sort/search/genres) =====
export const fetchExplore = ({ page = 1, type = '', status = '', sort = '', search = '', genres = '' } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);
  if (genres) params.set('genres', genres);
  return apiFetch(`/api/explore?${params.toString()}`);
};

// ===== Daftar genre untuk filter =====
export const fetchGenres = () => apiFetch('/api/genres');

// ===== Global proxy (gambar / video) =====
export const proxied = (url) =>
  url ? `${BASE}/api/proxy?url=${encodeURIComponent(url)}` : '';

// Helper: url eksternal AnibiPlay untuk konten non-anime (manga/novel)
export const externalUrl = (item) =>
  item?.url?.startsWith('http') ? item.url : `https://anibiplay.net${item?.url || ''}`;

// Helper: apakah stream bisa dimainkan di <video> (direct file) atau butuh iframe
export const isDirectStream = (stream) =>
  stream?.kind === 'direct' || /\.(mp4|webm|m3u8|mkv|mov|ts)(\?|#|$)/i.test(stream?.url || '');
