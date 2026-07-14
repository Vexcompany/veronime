const BASE = import.meta.env.VITE_API_BASE || '';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const fetchTerbaru = (page = 1) =>
  apiFetch(`/api/terbaru?page=${page}`);

export const fetchDetail = (slug) =>
  apiFetch(`/api/detail?slug=${encodeURIComponent(slug)}`);

export const fetchSearch = (q) =>
  apiFetch(`/api/search?q=${encodeURIComponent(q)}`);

export const fetchSchedule = (day = 'monday', perpage = 0) =>
  apiFetch(`/api/schedule?day=${day}&perpage=${perpage}`);

export const fetchStream = (episodeUrl) =>
  apiFetch(`/api/stream?url=${encodeURIComponent(episodeUrl)}`);
