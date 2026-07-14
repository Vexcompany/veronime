const BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Anime terbaru — page 1, 2, 3, ...
export const fetchTerbaru = (page = 1) =>
  apiFetch(`/api/terbaru?page=${page}`);

// Detail anime by slug
export const fetchDetail = (slug) =>
  apiFetch(`/api/detail?slug=${encodeURIComponent(slug)}`);

// Hanya poster dari detail API (di-cache 1 hari di Vercel)
export const fetchPoster = (slug) =>
  apiFetch(`/api/poster?slug=${encodeURIComponent(slug)}`);

// Search
export const fetchSearch = (q) =>
  apiFetch(`/api/search?q=${encodeURIComponent(q)}`);

// Jadwal per hari
export const fetchSchedule = (day = 'monday', perpage = 0) =>
  apiFetch(`/api/schedule?day=${day}&perpage=${perpage}`);

// Stream — auto-fallback Wibufile → Mega
export const fetchStream = (episodeUrl) =>
  apiFetch(`/api/stream?url=${encodeURIComponent(episodeUrl)}`);

// Stream — pilih server spesifik (misal user ganti kualitas)
export const fetchStreamByServer = (slug, serverId) =>
  apiFetch(`/api/stream?slug=${encodeURIComponent(slug)}&server=${serverId}`);
