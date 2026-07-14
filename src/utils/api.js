// utils/api.js — Semua fetch ke Vercel serverless functions
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

// Search by keyword
export const fetchSearch = (q) =>
  apiFetch(`/api/search?q=${encodeURIComponent(q)}`);

// Jadwal by hari + jumlah tampil (perpage=0 = semua)
export const fetchSchedule = (day = 'monday', perpage = 0) =>
  apiFetch(`/api/schedule?day=${day}&perpage=${perpage}`);

// Stream — scrape halaman episode, ambil Pixeldrain URL
export const fetchStream = (episodeUrl) =>
  apiFetch(`/api/stream?url=${encodeURIComponent(episodeUrl)}`);
