// api/explore.js — Katalog paginated AnibiPlay
// GET /api/explore?page=1&type=TV&status=ongoing&sort=latest_update&search=naruto&genres=action,fantasy
const { explore } = require('./_lib/anibiplay');
const { normalizePaginator, normalizeGenres } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.EXPLORE / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const {
    page = '1',
    type = '',
    status = '',
    sort = '',
    search: searchKw = '',
    genres = '',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const genreList = String(genres)
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);

  try {
    const cacheKey = `explore:${pageNum}:${type}:${status}:${sort}:${searchKw}:${genreList.join('|')}`;
    let payload = cacheGet(cacheKey);
    if (!payload) {
      const raw = await explore(pageNum, type, status, searchKw, genreList, sort);
      if (raw?.error) return res.status(500).json({ error: raw.error });

      const { results, pagination } = normalizePaginator(raw.animes, pageNum);

      payload = {
        results,
        pagination,
        genres: normalizeGenres(raw.genres),
        filters: {
          page: pageNum,
          type: type || null,
          status: status || null,
          sort: sort || null,
          search: searchKw || null,
          genres: genreList,
          ...(raw.filters && typeof raw.filters === 'object' ? { _applied: raw.filters } : {}),
        },
        source: 'anibiplay',
      };
      cacheSet(cacheKey, payload, TTL.EXPLORE);
    }
    return res.json(payload);
  } catch (error) {
    return sendError(res, 'Gagal mengambil katalog', error);
  }
};
