// Base URL for Vercel serverless functions (same origin in production)
const BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchAnimeList(type = 'ongoing', page = 1) {
  const res = await fetch(`${BASE}/api/anime-list?type=${type}&page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch anime list');
  return res.json();
}

export async function fetchAnimeDetail(slug) {
  const res = await fetch(`${BASE}/api/anime-detail?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Failed to fetch anime detail');
  return res.json();
}

export async function fetchStream(episodeUrl) {
  const res = await fetch(`${BASE}/api/stream?url=${encodeURIComponent(episodeUrl)}`);
  if (!res.ok) throw new Error('Failed to fetch stream');
  return res.json();
}

export async function fetchSearch(query) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

export async function fetchEpisodeDetail(episodeUrl) {
  const res = await fetch(`${BASE}/api/episode-detail?url=${encodeURIComponent(episodeUrl)}`);
  if (!res.ok) throw new Error('Failed to fetch episode detail');
  return res.json();
}
