// api/detail.js — Detail anime + daftar episode lengkap (AnibiPlay)
// GET /api/detail?slug=sasaki-to-pii-chan
const { getAnimeDetails } = require('./_lib/anibiplay');
const { normalizeDetail } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.DETAIL / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug dibutuhkan' });

  try {
    const cacheKey = `detail:${slug}`;
    let payload = cacheGet(cacheKey);
    if (!payload) {
      const raw = await getAnimeDetails(slug);
      if (!raw || raw.error) {
        return res.status(404).json({ error: raw?.error || `Anime "${slug}" tidak ditemukan` });
      }
      payload = normalizeDetail(raw, slug);
      cacheSet(cacheKey, payload, TTL.DETAIL);
    }
    return res.json(payload);
  } catch (error) {
    return sendError(res, 'Gagal mengambil detail anime', error);
  }
};
