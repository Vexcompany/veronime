// api/genres.js — Daftar genre untuk filter explore (cached 6 jam)
// GET /api/genres
const { explore } = require('./_lib/anibiplay');
const { normalizeGenres } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.GENRES / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let genres = cacheGet('genres');
    if (!genres) {
      const raw = await explore(1);
      if (raw?.error) return res.status(500).json({ error: raw.error });
      genres = normalizeGenres(raw.genres);
      cacheSet('genres', genres, TTL.GENRES);
    }
    return res.json({ genres, total: genres.length, source: 'anibiplay' });
  } catch (error) {
    return sendError(res, 'Gagal mengambil daftar genre', error);
  }
};
