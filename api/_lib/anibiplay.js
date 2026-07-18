// api/_lib/anibiplay.js — Scraper AnibiPlay (https://anibiplay.net)
// Sumber : file AnibiPlay.js dari user, dirapikan + hardening (retry, proxy env)
//
// Fitur:
//  1. getHomepage()        — semua section homepage (anime, manga, novel)
//  2. search(query)        — search anime & manga & novel (JSON API)
//  3. getAnimeDetails()    — detail anime + daftar episode lengkap
//  4. getEpisodeDetails()  — detail episode (mirror stream embed & download)
//  5. explore()            — katalog paginated (page, type, status, search, genre)
//  6. setProxy()           — global proxy untuk semua request
//
// Proxy otomatis aktif jika env ANIBIPLAY_PROXY / SCRAPE_PROXY / PROXY_URL / HTTPS_PROXY di-set.

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = (process.env.ANIBIPLAY_BASE || 'https://anibiplay.net').replace(/\/+$/, '') + '/';

let globalProxy =
  process.env.ANIBIPLAY_PROXY ||
  process.env.SCRAPE_PROXY ||
  process.env.PROXY_URL ||
  process.env.HTTPS_PROXY ||
  null;

/**
 * Configure global proxy for Axios requests.
 * @param {string} proxyUrl - Proxy URL (e.g. http://127.0.0.1:8080 atau http://user:pass@host:port)
 */
function setProxy(proxyUrl) {
  globalProxy = proxyUrl;
}

function getProxy() {
  return globalProxy;
}

/**
 * Build axios proxy config object dari URL string.
 */
function buildProxyConfig() {
  if (!globalProxy) return undefined;
  try {
    const parsed = new URL(globalProxy);
    const proxy = {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
    };
    if (parsed.username) {
      proxy.auth = {
        username: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password || ''),
      };
    }
    return proxy;
  } catch (e) {
    return undefined; // ignore proxy parse errors
  }
}

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Perform a GET request to the site dengan retry sederhana.
 * @param {string} url - Target URL
 * @param {object} params - Query parameters
 * @param {object} extraHeaders - Header tambahan (override)
 */
async function fetchPage(url, params = {}, extraHeaders = {}) {
  const requestConfig = {
    headers: { ...DEFAULT_HEADERS, ...extraHeaders },
    params,
    timeout: 15000,
    maxRedirects: 5,
  };

  const proxy = buildProxyConfig();
  if (proxy) requestConfig.proxy = proxy;

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.get(url, requestConfig);
      return response.data;
    } catch (err) {
      lastError = err;
      // Jangan retry untuk 404/400
      const status = err.response?.status;
      if (status && status >= 400 && status < 500) break;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastError;
}

/**
 * Extract Inertia.js data-page payload from HTML page.
 * @param {string} html - HTML page content
 */
function parseInertiaPayload(html) {
  const $ = cheerio.load(html);
  const dataPageAttr = $('#app').attr('data-page') || $('[data-page]').attr('data-page');
  if (!dataPageAttr) {
    throw new Error('Could not find Inertia.js data-page attribute on page.');
  }
  return JSON.parse(dataPageAttr);
}

/**
 * Fetch halaman Inertia dan kembalikan object props-nya.
 */
async function fetchProps(path, params = {}) {
  const html = await fetchPage(path.startsWith('http') ? path : `${BASE_URL}${path.replace(/^\/+/, '')}`, params);
  const payload = parseInertiaPayload(html);
  return payload.props || {};
}

/**
 * 1. Get Homepage Sections (Anime, Manga, Novels)
 */
async function getHomepage() {
  const props = await fetchProps('');
  return {
    featured: props.featured || [],
    latestUpdates: props.latestUpdates || [],
    popular: props.popular || {},
    recommended: props.recommended || [],
    popularManga: props.popularManga || [],
    popularNovels: props.popularNovels || [],
    latestMangaUpdates: props.latestMangaUpdates || [],
    latestNovelUpdates: props.latestNovelUpdates || [],
    // Sertakan props mentah juga agar fitur baru yang belum terpetakan
    // tetap bisa dipakai tanpa ubah scraper.
    _props: props,
  };
}

/**
 * 2. Search Anime & Manga (dan Novel)
 * @param {string} query - Search query
 */
async function search(query) {
  const data = await fetchPage(`${BASE_URL}api/search`, { q: query }, { Accept: 'application/json' });
  return Array.isArray(data) ? data : [];
}

/**
 * 3. Get Anime Details & Episode list
 * @param {string} slug - Anime slug (e.g. "sasaki-to-pii-chan")
 */
async function getAnimeDetails(slug) {
  const props = await fetchProps(`anime/${slug}`);
  if (props.anime) props.anime._propsIncluded = undefined;
  return props.anime ? { ...props.anime, _props: props } : null;
}

/**
 * 4. Get Episode details (mirror streams & downloads)
 * @param {string} slug - Anime slug
 * @param {number|string} episodeNumber - Episode number
 */
async function getEpisodeDetails(slug, episodeNumber) {
  const props = await fetchProps(`anime/${slug}/episode/${episodeNumber}`);
  return {
    anime: props.anime || null,
    episode: props.episode || null,
    allEpisodes: props.allEpisodes || [],
    _props: props,
  };
}

/**
 * 5. Explore / Browse Paginated Catalog
 * @param {number|string} page - Page index (starts at 1)
 * @param {string} type - Anime type filter (e.g. "TV", "Movie", "Special")
 * @param {string} status - Anime status filter (e.g. "ongoing", "completed")
 * @param {string} search - Search query keyword
 * @param {Array|string} genres - Genre slug array/string to filter
 * @param {string} sort - Urutan (e.g. "latest", "latest_update", "popular", "rating", "title")
 */
async function explore(page = 1, type = '', status = '', searchKw = '', genres = [], sort = '') {
  const params = { page: String(page) };
  if (type) params.type = type;
  if (status) params.status = status;
  if (searchKw) params.search = searchKw;
  if (sort) params.sort = sort;

  const genreList = Array.isArray(genres) ? genres : [genres];
  const cleanGenres = genreList.filter(Boolean);
  if (cleanGenres.length > 0) {
    params.genres = cleanGenres.join(',');
  }

  const props = await fetchProps('explore', params);
  return {
    animes: props.animes || {},
    genres: props.genres || [],
    filters: props.filters || {},
    _props: props,
  };
}

module.exports = {
  BASE_URL,
  setProxy,
  getProxy,
  fetchPage,
  parseInertiaPayload,
  getHomepage,
  search,
  getAnimeDetails,
  getEpisodeDetails,
  explore,
};
