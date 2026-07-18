// api/_lib/handlers.js — Semua handler route API veronime (dipakai oleh api/[...slug].js)
// Route tersedia: home, detail, episode, search, explore, genres, proxy, debug
const axios = require('axios');
const { getHomepage, getAnimeDetails, getEpisodeDetails, search, explore, getProxy, BASE_URL } = require('./anibiplay');
const {
  buildHomeSections,
  normalizeDetail,
  normalizeEpisodePage,
  normalizeCardList,
  normalizePaginator,
  normalizeGenres,
} = require('./normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./http');

// ===== GET /api/home — semua section homepage + hero =====
async function handleHome(req, res) {
  cacheControl(res, TTL.HOME / 1000);
  let payload = cacheGet('home');
  if (!payload) {
    const home = await getHomepage();
    const sections = buildHomeSections(home._props || home);

    const pick = (key) => sections.find((s) => s.key === key)?.items?.[0];
    const hero =
      pick('featured') || pick('ongoing') || pick('latestUpdates') || sections[0]?.items?.[0] || null;

    payload = { hero, sections, source: 'anibiplay' };
    cacheSet('home', payload, TTL.HOME);
  }
  return res.json(payload);
}

// ===== GET /api/detail?slug=... — detail anime + semua episode =====
async function handleDetail(req, res) {
  cacheControl(res, TTL.DETAIL / 1000);
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug dibutuhkan' });

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
}

// ===== GET /api/episode?slug=...&ep=... — mirror stream + download + prev/next =====
async function handleEpisode(req, res) {
  cacheControl(res, TTL.EPISODE / 1000);
  const { slug, ep } = req.query;
  if (!slug || !ep) return res.status(400).json({ error: "Parameter 'slug' dan 'ep' dibutuhkan" });

  const cacheKey = `episode:${slug}:${ep}`;
  let payload = cacheGet(cacheKey);
  if (!payload) {
    const raw = await getEpisodeDetails(slug, ep);
    if (raw?.error) return res.status(404).json({ error: raw.error });
    if (!raw?.episode) {
      return res.status(404).json({ error: `Episode ${ep} dari "${slug}" tidak ditemukan` });
    }
    payload = normalizeEpisodePage(raw, slug, String(ep));

    const nums = (payload.allEpisodes || []).map((e) => e.number).sort((a, b) => a - b);
    const cur = payload.episode?.number;
    if (cur != null && nums.length) {
      payload.prev = [...nums].reverse().find((n) => n < cur) ?? null;
      payload.next = nums.find((n) => n > cur) ?? null;
    } else {
      payload.prev = null;
      payload.next = null;
    }

    cacheSet(cacheKey, payload, TTL.EPISODE);
  }
  return res.json(payload);
}

// ===== GET /api/search?q=... — search anime, manga & novel =====
async function handleSearch(req, res) {
  cacheControl(res, TTL.SEARCH / 1000);
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Query q dibutuhkan' });

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
}

// ===== GET /api/explore?page=&type=&status=&sort=&search=&genres= — katalog paginated =====
async function handleExplore(req, res) {
  cacheControl(res, TTL.EXPLORE / 1000);
  const { page = '1', type = '', status = '', sort = '', search: searchKw = '', genres = '' } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const genreList = String(genres).split(',').map((g) => g.trim()).filter(Boolean);

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
}

// ===== GET /api/genres — daftar genre (cached 6 jam) =====
async function handleGenres(req, res) {
  cacheControl(res, TTL.GENRES / 1000);
  let genres = cacheGet('genres');
  if (!genres) {
    const raw = await explore(1);
    if (raw?.error) return res.status(500).json({ error: raw.error });
    genres = normalizeGenres(raw.genres);
    cacheSet('genres', genres, TTL.GENRES);
  }
  return res.json({ genres, total: genres.length, source: 'anibiplay' });
}

// ===== GET /api/proxy?url=... — global media proxy (gambar/video, Range support) =====
const PRIVATE_HOST =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|\[?::1\]?$)/i;
const MAX_BYTES = 60 * 1024 * 1024;
const REFERER_MAP = [
  [/anilist\.co$/i, 'https://anilist.co/'],
  [/komiku\.org$/i, 'https://komiku.org/'],
  [/mega\.(co\.)?nz$/i, 'https://mega.nz/'],
];

async function handleProxy(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method tidak didukung' });
  }

  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "Parameter 'url' dibutuhkan" });

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }
  if (!/^https?:$/.test(parsed.protocol)) return res.status(400).json({ error: 'Hanya http/https' });
  if (PRIVATE_HOST.test(parsed.hostname)) return res.status(400).json({ error: 'Host tidak diizinkan' });

  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
      Referer: `${parsed.protocol}//${parsed.host}/`,
    };
    if (req.headers.range) headers.Range = req.headers.range;
    for (const [pattern, ref] of REFERER_MAP) {
      if (pattern.test(parsed.hostname)) headers.Referer = ref;
    }

    const upstream = await axios.get(target, {
      headers,
      responseType: 'stream',
      timeout: 25000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });

    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    for (const h of passHeaders) {
      if (upstream.headers[h]) res.setHeader(h, upstream.headers[h]);
    }

    const contentType = upstream.headers['content-type'] || '';
    let cacheSeconds = 3600;
    if (/^image\//i.test(contentType)) cacheSeconds = 86400;
    else if (/mpegurl|vnd\.apple/i.test(contentType)) cacheSeconds = 60;
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate`);

    const declared = parseInt(upstream.headers['content-length'] || '0');
    if (declared > MAX_BYTES) {
      upstream.data.destroy();
      return res.status(413).json({ error: 'File terlalu besar untuk di-proxy' });
    }

    res.status(upstream.status);
    if (req.method === 'HEAD') return res.end();
    upstream.data.pipe(res);
    upstream.data.on('error', () => res.end());
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({ error: `Proxy gagal: ${error.message}` });
  }
}

// ===== GET /api/debug?what=home|detail|episode|explore|search|proxy — raw props =====
async function handleDebug(req, res) {
  const { what = 'home', slug = '', ep = '1', page = '1', type = '', status = '', search: s = '', genres = '', sort = '' } = req.query;
  const anibi = { getHomepage, getAnimeDetails, getEpisodeDetails, search, explore };
  switch (what) {
    case 'home':
      return res.json(await anibi.getHomepage());
    case 'detail':
      if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });
      return res.json(await anibi.getAnimeDetails(slug));
    case 'episode':
      if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });
      return res.json(await anibi.getEpisodeDetails(slug, ep));
    case 'explore': {
      const genreList = String(genres).split(',').map((g) => g.trim()).filter(Boolean);
      return res.json(await anibi.explore(page, type, status, s, genreList, sort));
    }
    case 'search':
      return res.json(await anibi.search(req.query.q || 'naruto'));
    case 'proxy':
      return res.json({ proxy: getProxy() ? '(configured)' : null, base: BASE_URL });
    default:
      return res.status(400).json({ error: 'what harus salah satu dari: home, detail, episode, explore, search, proxy' });
  }
}

// ===== /api — info endpoint =====
function handleIndex(req, res) {
  return res.json({
    name: 'veronime-api',
    version: 3,
    source: 'anibiplay',
    routes: ['home', 'detail', 'episode', 'search', 'explore', 'genres', 'proxy', 'debug'],
    _echo: { url: req.url || null, query: req.query || {} },
  });
}

module.exports = {
  home: handleHome,
  detail: handleDetail,
  episode: handleEpisode,
  search: handleSearch,
  explore: handleExplore,
  genres: handleGenres,
  proxy: handleProxy,
  debug: handleDebug,
  index: handleIndex,
};
