// Semua fetch ke Vercel serverless functions (same-origin di production)
const BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchAnimeList(type = 'ongoing', page = 1) {
  const res = await fetch(`${BASE}/api/anime-list?type=${type}&page=${page}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAnimeDetail(slug) {
  const res = await fetch(`${BASE}/api/anime-detail?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchStream(episodeUrl) {
  const res = await fetch(`${BASE}/api/stream?url=${encodeURIComponent(episodeUrl)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSearch(query) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchHomeData() {
  const res = await fetch(`${BASE}/api/home-data`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
