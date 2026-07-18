// api/search.js — Search anime & manga (& novel) via AnibiPlay
// GET /api/search?q=sasaki
const { search } = require('./_lib/anibiplay');
const { normalizeCardList } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.SEARCH / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Query q dibutuhkan' });

  try {
    const cacheKey = `search:${q.toLowerCase()}`;
    let payload = cacheGet(cacheKey);
    if (!payload) {
      const raw = await search(q);
      if (raw?.error) return res.status(500).json({ error: raw.error });
      const results = normalizeCardList(raw);
      const counts = results.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {});
      payload = { results, total: results.length, counts, query: q, source: 'anibiplay' };
      cacheSet(cacheKey, payload, TTL.SEARCH);
    }
    return res.json(payload);
  } catch (error) {
    return sendError(res, 'Gagal melakukan pencarian', error);
  }
};
