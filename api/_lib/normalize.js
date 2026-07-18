// api/_lib/normalize.js — Normalisasi data AnibiPlay -> bentuk kanonik veronime.
// Key-name di Inertia props bisa berubah sewaktu-waktu, jadi semua
// normalizer memakai alias fallback dan deep-collector yang toleran.

const MEDIA_EXT = /\.(mp4|webm|m3u8|mkv|mov|ts)(\?|#|$)/i;

function stripHtml(str = '') {
  return String(str)
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function firstOf(obj, ...keys) {
  for (const k of keys) {
    if (obj == null) break;
    const v = keyPath(obj, k);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function keyPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function asNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  const m = String(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function capitalize(v) {
  if (!v) return v;
  const s = String(v);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractSlug(url) {
  if (!url) return '';
  const str = String(url);
  const m = str.match(/\/(anime|manga|novel)\/([^/?#]+)/);
  if (m) return m[2];
  const parts = str.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || '';
}

function looksLikeCard(item) {
  if (!item || typeof item !== 'object') return false;
  const title = firstOf(item, 'title', 'name', 'judul');
  const slug = firstOf(item, 'slug', 'url', 'link');
  return Boolean(title && slug);
}

/**
 * Normalisasi satu item "card" (dipakai di homepage, explore, search, related).
 */
function normalizeCard(raw = {}, forcedCategory = '') {
  if (!raw || typeof raw !== 'object') return null;

  const url = firstOf(raw, 'url', 'link', 'href') || '';
  const slug = firstOf(raw, 'slug') || extractSlug(url);
  const title = firstOf(raw, 'title', 'name', 'judul') || '';

  const image = firstOf(
    raw,
    'poster', 'cover', 'image', 'thumbnail', 'cover_image', 'coverImage',
    'banner', 'img', 'picture', 'poster_url', 'posterUrl'
  ) || '';

  const categoryRaw =
    forcedCategory || firstOf(raw, 'category', 'kategori', 'type_meta') || '';
  let category = String(categoryRaw || 'anime').toLowerCase();
  // Deteksi dari URL /manga/... atau /novel/... bila category kosong
  if (!category || category === 'anime') {
    const m = String(url).match(/\/(anime|manga|novel)\//);
    if (m) category = m[1];
  }

  const type = firstOf(raw, 'type', 'format') || '';
  const status = firstOf(raw, 'status', 'airing_status') || '';
  const score = asNumber(
    firstOf(raw, 'rating', 'score', 'ratings', 'average_score', 'averageScore', 'vote')
  );
  const year =
    firstOf(raw, 'year', 'released_year', 'release_year') ||
    (String(firstOf(raw, 'released', 'release_date', 'aired') || '').match(/(\d{4})/) || [])[1] ||
    null;

  const episodeCount = asNumber(
    firstOf(raw, 'episodes_count', 'episode_count', 'episodesCount', 'total_episodes', 'totalEpisodes', 'episodes')
  );

  // Info episode terbaru (nomornya saja)
  let latestEpisode = null;
  const le = firstOf(raw, 'latest_episode', 'last_episode', 'latestEpisode', 'episode');
  if (typeof le === 'number' || typeof le === 'string') {
    latestEpisode = asNumber(String(le).match(/(\d+(\.\d+)?)/)?.[0]);
  } else if (le && typeof le === 'object') {
    latestEpisode = asNumber(firstOf(le, 'number', 'episode_number', 'episode', 'ep'));
  }
  // latest_episodes berbentuk array (berisi beberapa episode terakhir)
  let latestEpisodes = [];
  const les = firstOf(raw, 'latest_episodes', 'latestEpisodes', 'new_episodes', 'recent_episodes');
  if (Array.isArray(les)) {
    latestEpisodes = les
      .map((ep) => ({
        number: asNumber(firstOf(ep, 'number', 'episode_number', 'episode', 'ep') ?? String(firstOf(ep, 'title', 'name') || '')?.match(/(\d+(\.\d+)?)/)?.[0]),
        date: firstOf(ep, 'date', 'created_at', 'createdAt', 'updated_at', 'released', 'time_ago', 'timeAgo') || null,
        title: firstOf(ep, 'title', 'name') || null,
      }))
      .filter((e) => e.number !== null);
    if (latestEpisode === null && latestEpisodes.length) {
      latestEpisode = Math.max(...latestEpisodes.map((e) => e.number));
    }
  }

  // views (dipakai di explore)
  const views = firstOf(raw, 'views', 'view_count', 'views_count') || null;

  // Sinopsis singkat kalau ada
  const synopsisRaw = firstOf(raw, 'synopsis', 'description', 'desc', 'summary');
  const synopsis = synopsisRaw ? stripHtml(synopsisRaw).slice(0, 320) : null;

  // Genre — bisa string[] atau object[]
  const genresArr = firstOf(raw, 'genres', 'genre', 'genre_list') || [];
  const genres = (Array.isArray(genresArr) ? genresArr : [])
    .map((g) => (typeof g === 'string' ? g : firstOf(g, 'name', 'title', 'label')))
    .filter(Boolean)
    .slice(0, 6);

  return {
    title: String(title),
    slug: String(slug),
    image: String(image),
    episode: latestEpisode !== null ? `Ep ${latestEpisode}` : null,
    latestEpisodes,
    episodeCount,
    status: status ? capitalize(status) : null,
    type: type ? String(type).toUpperCase() : null,
    score,
    year: year ? String(year) : null,
    released: firstOf(raw, 'released', 'release_date', 'display_date') || null,
    views: views ? String(views) : null,
    genres,
    category, // anime | manga | novel
    url: url || `/${category}/${slug}`,
    external: category !== 'anime',
    synopsis,
  };
}

/**
 * Normalisasi daftar: filter item non-card, dedup by slug.
 */
function normalizeCardList(list, forcedCategory = '') {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const card = normalizeCard(item, forcedCategory);
    if (!card || !card.slug) continue;
    const key = card.category + ':' + card.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

/**
 * Label cantik untuk key section homepage.
 */
const SECTION_META = {
  featured:          { title: 'FEATURED',            category: 'anime', tag: 'HOT' },
  ongoing:           { title: 'ANIME ONGOING',        category: 'anime', viewAll: '/explore?status=ongoing' },
  latestUpdates:     { title: 'UPDATE ANIME TERBARU', category: 'anime', tag: 'LIVE', viewAll: '/ongoing' },
  recommended:       { title: 'REKOMENDASI',          category: 'anime' },
  popular:           { title: 'ANIME POPULER',        category: 'anime', viewAll: '/popular' },
  popularAnime:      { title: 'ANIME POPULER',        category: 'anime', viewAll: '/popular' },
  popularManga:      { title: 'MANGA POPULER',        category: 'manga' },
  latestMangaUpdates:{ title: 'UPDATE MANGA TERBARU', category: 'manga', tag: 'NEW' },
  popularNovels:     { title: 'NOVEL POPULER',        category: 'novel' },
  latestNovelUpdates:{ title: 'UPDATE NOVEL TERBARU', category: 'novel', tag: 'NEW' },
};

function prettifyKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

// Key props yang bukan "section konten" — jangan dijadikan row homepage
const SECTION_IGNORE = new Set([
  'genres', 'genre', 'filters', 'errors', 'auth', 'flash', 'ziggy', 'url',
  'version', 'queryParams', 'params', 'seo', 'meta', 'user', 'csrf', 'locale',
]);

/**
 * Bangun semua section dari props homepage (termasuk key yang belum terpetakan).
 */
function buildHomeSections(props = {}) {
  const sections = [];
  for (const [key, value] of Object.entries(props)) {
    if (SECTION_IGNORE.has(key)) continue;
    let items = value;
    // Bentuk { day: [], week: [], month: [] } -> ambil array pertama yang tidak kosong
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const candidate = Object.values(value).find((v) => Array.isArray(v) && v.length);
      items = candidate || [];
    }
    if (!Array.isArray(items) || !items.length) continue;
    if (!items.some(looksLikeCard)) continue;

    const meta = SECTION_META[key] || {};
    const guessedCategory =
      meta.category || (key.toLowerCase().includes('manga') ? 'manga' : key.toLowerCase().includes('novel') ? 'novel' : 'anime');

    const cards = normalizeCardList(items, meta.category ? '' : guessedCategory);
    if (!cards.length) continue;

    sections.push({
      key,
      title: meta.title || prettifyKey(key),
      tag: meta.tag || null,
      viewAll: meta.viewAll || null,
      category: guessedCategory,
      items: cards,
    });
  }

  // Urutkan: key yang dikenal dulu sesuai urutan SECTION_META, sisanya di belakang
  const knownOrder = Object.keys(SECTION_META);
  sections.sort((a, b) => {
    const ia = knownOrder.indexOf(a.key);
    const ib = knownOrder.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return sections;
}

/**
 * Normalisasi detail anime + episode list lengkap.
 */
function normalizeDetail(animeRaw = {}, slug = '') {
  const card = normalizeCard(animeRaw) || {};

  const synopsisRaw = firstOf(animeRaw, 'synopsis', 'description', 'desc', 'summary');
  const eps = firstOf(animeRaw, 'episodes', 'episode_list', 'episodeList') || [];

  const episodes = (Array.isArray(eps) ? eps : [])
    .map((ep, idx) => {
      const numRaw =
        firstOf(ep, 'number', 'episode_number', 'episode', 'ep') ??
        String(firstOf(ep, 'title', 'name') || '').match(/(\d+(\.\d+)?)/)?.[0];
      const number = asNumber(numRaw) ?? idx + 1;
      return {
        number,
        title: firstOf(ep, 'title', 'name') || `Episode ${number}`,
        date: firstOf(ep, 'date', 'created_at', 'createdAt', 'aired', 'released') || null,
        url: `/anime/${slug}/episode/${number}`,
      };
    })
    .filter((e) => e.number !== null && e.number !== undefined);

  // Urutkan menaik
  episodes.sort((a, b) => a.number - b.number);

  const related = normalizeCardList(firstOf(animeRaw, 'related', 'recommendations', 'similar') || []);

  const trailerRaw = firstOf(animeRaw, 'trailer', 'trailer_url', 'trailerUrl', 'youtube');
  const trailer =
    typeof trailerRaw === 'string'
      ? trailerRaw
      : trailerRaw && typeof trailerRaw === 'object'
      ? firstOf(trailerRaw, 'url', 'embed', 'src')
      : null;

  const genresArr = firstOf(animeRaw, 'genres', 'genre', 'genre_list') || [];
  const genres = (Array.isArray(genresArr) ? genresArr : [])
    .map((g) => (typeof g === 'string' ? g : firstOf(g, 'name', 'title', 'label')))
    .filter(Boolean);

  const studioRaw = firstOf(animeRaw, 'studio', 'studios', 'producer');
  const studio = Array.isArray(studioRaw)
    ? studioRaw.map((s) => (typeof s === 'string' ? s : firstOf(s, 'name', 'title'))).filter(Boolean).join(', ')
    : studioRaw || null;

  return {
    title: card.title || '',
    slug: card.slug || slug,
    image: card.image || '',
    banner: firstOf(animeRaw, 'banner', 'cover_banner', 'backdrop', 'background') || null,
    score: card.score,
    year: card.year,
    type: card.type,
    status: firstOf(animeRaw, 'status') ? capitalize(animeRaw.status) : card.status,
    studio,
    released: card.released || (card.year ? String(card.year) : null),
    totalEpisodes: card.episodeCount ?? (episodes.length || null),
    genres,
    synopsis: synopsisRaw ? stripHtml(synopsisRaw) : null,
    trailer,
    episodes,
    related,
    source: 'anibiplay',
  };
}

/* =================== EPISODE / STREAM =================== */

function looksLikeUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim());
}

/**
 * Deep-collector: cari semua object/string yang "kayak stream" dalam struktur
 * apa pun (mirrors, streams, servers, video.sources, { "480p": [...] }, dst).
 */
function collectStreams(root) {
  const out = [];
  const seen = new Set();

  const URL_KEYS = ['url', 'embed', 'embed_url', 'embedUrl', 'src', 'link', 'file', 'player', 'stream', 'iframe'];
  const LABEL_KEYS = ['server', 'name', 'host', 'label', 'server_name', 'serverName'];
  const QUALITY_KEYS = ['quality', 'resolution', 'res', 'label_quality'];
  // Keys yang PASTI bukan stream — jangan ambil URL di dalamnya
  const BLOCK_KEYS = new Set([
    'downloads', 'download', 'download_links', 'downloadLinks', 'dl',
    'poster', 'cover', 'cover_image', 'coverImage', 'image', 'images', 'thumbnail', 'thumb',
    'banner', 'backdrop', 'avatar', 'icon', 'logo', 'screenshot', 'screenshots', 'photo', 'picture',
    'trailer', 'youtube', 'comments', 'replies', 'user', 'author',
    'anime', 'series', 'related', 'recommendations', 'similar',
    'genres', 'genre', 'episodes', 'allEpisodes', 'all_episodes',
  ]);

  const hostLabel = (url) => {
    try {
      const h = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      return h ? h.charAt(0).toUpperCase() + h.slice(1) : '';
    } catch { return ''; }
  };

  const SELF_HOST = /(^|\.)anibiplay\.net$/i;

  const push = (url, label, quality) => {
    if (!looksLikeUrl(url)) return;
    const clean = url.trim();
    if (seen.has(clean)) return;
    // URL ke situs sumber sendiri (halaman, poster, dsb) bukan mirror video
    try {
      if (SELF_HOST.test(new URL(clean).hostname)) return;
    } catch { return; }
    seen.add(clean);
    const kind = MEDIA_EXT.test(clean) ? 'direct' : 'embed';
    const finalLabel = (label && String(label)) || hostLabel(clean) || `Server ${out.length + 1}`;
    out.push({
      id: `s${out.length}`,
      label: finalLabel,
      quality: quality ? String(quality).replace(/p$/i, '') + 'p' : 'default',
      url: clean,
      kind, // 'direct' -> <video>, 'embed' -> <iframe>
    });
  };

  const walk = (node, ctxLabel = '', ctxQuality = '', fromBlocked = false) => {
    if (node == null) return;

    if (typeof node === 'string') {
      if (!fromBlocked && looksLikeUrl(node)) push(node, ctxLabel, ctxQuality);
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) walk(item, ctxLabel, ctxQuality, fromBlocked);
      return;
    }

    if (typeof node === 'object') {
      const entries = Object.entries(node);

      // Object yang sendirinya satu stream?
      if (!fromBlocked) {
        const url = URL_KEYS.map((k) => node[k]).find(looksLikeUrl);
        if (url) {
          const label = LABEL_KEYS.map((k) => node[k]).find((v) => typeof v === 'string' && v) || ctxLabel;
          const quality =
            QUALITY_KEYS.map((k) => node[k]).find((v) => v != null && v !== '') || ctxQuality || '';
          push(url, label, String(quality));
          return; // jangan recurse lebih dalam — hindari dobel/kebocoran
        }
      }

      // Keys yang namanya generic — jangan dijadikan label
      const NON_LABEL_KEYS = ['video', 'source', 'default', 'auto', 'file_url', 'video_url', 'stream_url', 'link_video'];

      for (const [k, v] of entries) {
        if (BLOCK_KEYS.has(k)) continue;
        // Kualitas dari key objek: { "480p": [...] }
        const qualityKey = /(\d{3,4})\s*p/i.test(k) ? k : ctxQuality;
        if (Array.isArray(v)) {
          walk(v, ctxLabel, qualityKey, fromBlocked);
        } else if (typeof v === 'string') {
          // String di bawah key url-ish: { embed: "https://..." } sudah ditangani
          // oleh object-level push di atas; string lain diabaikan kecuali URL langsung.
          // Nama key (mis. "desu", "odstream") bisa dipakai sebagai label.
          if (!URL_KEYS.includes(k) && looksLikeUrl(v)) {
            const labelFromKey = ctxLabel || (NON_LABEL_KEYS.includes(k) || k.length > 24 ? '' : k);
            walk(v, labelFromKey, qualityKey, fromBlocked);
          }
        } else if (v && typeof v === 'object') {
          walk(v, ctxLabel, qualityKey, fromBlocked);
        }
      }
    }
  };

  // Prioritas: containers yang memang stream-ish dulu
  const containers = [];
  const STREAM_KEYS = ['mirrors', 'streams', 'servers', 'videos', 'video', 'sources', 'embeds', 'players', 'watch', 'streaming', 'mirror', 'stream'];
  for (const k of STREAM_KEYS) {
    if (root && root[k] != null) containers.push(root[k]);
  }
  // Lalu seluruh root (fallback, dengan blocklist di atas)
  for (const c of containers) walk(c);
  walk(root);
  return out;
}

/**
 * Kumpulkan link download episode.
 */
function collectDownloads(root) {
  const out = [];
  const seen = new Set();
  const URL_KEYS = ['url', 'link', 'href', 'src', 'file'];

  const push = (url, label) => {
    if (!looksLikeUrl(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ label: label ? String(label) : `Link ${out.length + 1}`, url });
  };

  const walk = (node, ctxLabel = '') => {
    if (node == null) return;
    if (typeof node === 'string') {
      if (looksLikeUrl(node)) push(node, ctxLabel);
      return;
    }
    if (Array.isArray(node)) return node.forEach((i) => walk(i, ctxLabel));
    if (typeof node === 'object') {
      // { "480p": "url" } atau { "480p": [ {server, url} ] }
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && looksLikeUrl(v)) {
          push(v, ctxLabel || k);
        } else if (Array.isArray(v) || (v && typeof v === 'object')) {
          const label = /(\d{3,4})\s*p/i.test(k) ? k : ctxLabel;
          walk(v, label);
        }
      }
      const url = URL_KEYS.map((k) => node[k]).find(looksLikeUrl);
      if (url) {
        const label =
          ['label', 'name', 'server', 'quality', 'title'].map((k) => node[k]).find((v) => typeof v === 'string' && v) ||
          ctxLabel;
        push(url, label);
      }
    }
  };

  const containers = [];
  const KEYS = ['downloads', 'download', 'download_links', 'downloadLinks', 'dl'];
  for (const k of KEYS) if (root && root[k] != null) containers.push(root[k]);
  for (const c of containers) walk(c);
  return out;
}

/**
 * Normalisasi halaman episode: mirrors + downloads + semua episode.
 */
function normalizeEpisodePage(data = {}, slug = '', epNumber = '') {
  const { anime, episode, allEpisodes } = data;

  const animeCard = anime ? normalizeCard(anime) : { title: '', slug, image: '' };

  const epNum = asNumber(
    firstOf(episode || {}, 'number', 'episode_number', 'episode', 'ep') ?? epNumber
  );

  const streams = collectStreams(episode || {});
  const downloads = collectDownloads(episode || {});
  // Fallback: mungkin download ada di level props lebih tinggi
  if (!downloads.length && data._props) {
    for (const extra of collectDownloads(data._props)) downloads.push(extra);
  }
  // Fallback stream: kadang container di anime/current_episode
  if (!streams.length && data._props) {
    const props = data._props;
    for (const key of ['currentEpisode', 'current_episode', 'stream', 'mirrors', 'servers', 'videos']) {
      if (props[key] != null) collectStreams(props[key]).forEach((s) => streams.push(s));
    }
  }

  const allEps = (Array.isArray(allEpisodes) ? allEpisodes : []).map((ep, idx) => {
    const number =
      asNumber(firstOf(ep, 'number', 'episode_number', 'episode', 'ep')) ?? idx + 1;
    return {
      number,
      title: firstOf(ep, 'title', 'name') || `Episode ${number}`,
      date: firstOf(ep, 'date', 'created_at', 'createdAt', 'aired', 'released') || null,
      url: `/anime/${slug}/episode/${number}`,
    };
  });

  return {
    anime: {
      title: animeCard.title || '',
      slug: animeCard.slug || slug,
      image: animeCard.image || '',
      score: animeCard.score,
      status: animeCard.status,
      type: animeCard.type,
      totalEpisodes: animeCard.episodeCount ?? (allEps.length || null),
    },
    episode: {
      number: epNum,
      title: firstOf(episode || {}, 'title', 'name') || (epNum != null ? `Episode ${epNum}` : ''),
      date: firstOf(episode || {}, 'date', 'created_at', 'createdAt', 'aired', 'released') || null,
    },
    streams,
    downloads,
    locked: !streams.length,
    allEpisodes: allEps,
    source: 'anibiplay',
  };
}

/* =================== EXPLORE / PAGINATION =================== */

function normalizeGenres(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((g) => {
      if (typeof g === 'string') return { value: g.toLowerCase().replace(/\s+/g, '-'), label: g };
      const label = firstOf(g, 'name', 'title', 'label') || '';
      const value = firstOf(g, 'slug', 'value', 'id') || label;
      if (!label && !value) return null;
      return { value: String(value), label: String(label || value) };
    })
    .filter(Boolean);
}

function normalizePaginator(paginator = {}, reqPage = 1) {
  const data = Array.isArray(paginator.data) ? paginator.data : Array.isArray(paginator) ? paginator : [];
  const current = asNumber(firstOf(paginator, 'current_page', 'currentPage', 'page')) ?? reqPage;
  const last = asNumber(firstOf(paginator, 'last_page', 'lastPage', 'total_pages'));
  const total = asNumber(firstOf(paginator, 'total', 'count', 'total_items'));
  const perPage = asNumber(firstOf(paginator, 'per_page', 'perPage')) || (data.length || null);
  const hasNext =
    last != null ? current < last : Boolean(firstOf(paginator, 'next_page_url', 'nextPageUrl'));
  const hasPrev = current > 1;

  return {
    results: normalizeCardList(data),
    pagination: {
      page: current,
      last_page: last,
      per_page: perPage,
      total,
      has_next: hasNext,
      has_prev: hasPrev,
    },
  };
}

module.exports = {
  stripHtml,
  looksLikeCard,
  looksLikeUrl,
  isDirectMedia: (url) => MEDIA_EXT.test(String(url || '')),
  normalizeCard,
  normalizeCardList,
  buildHomeSections,
  normalizeDetail,
  normalizeEpisodePage,
  collectStreams,
  collectDownloads,
  normalizeGenres,
  normalizePaginator,
};
