// api/anime-list.js — Vercel Serverless Function
// Scrapes daftar anime dari Samehadaku menggunakan selector HTML yang tepat
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL,
};

// URL mapping sesuai struktur Samehadaku yang sebenarnya
const TYPE_URLS = {
  // Anime Terbaru = episode yg baru rilis (ongoing)
  ongoing: (page) => page > 1
    ? `${BASE_URL}/anime-terbaru/page/${page}/`
    : `${BASE_URL}/anime-terbaru/`,
  // Popular = top10 / daftar dengan sorting views
  popular: (page) => page > 1
    ? `${BASE_URL}/daftar-anime-2/page/${page}/?order=popular`
    : `${BASE_URL}/daftar-anime-2/?order=popular`,
  // Movie
  movie: (page) => page > 1
    ? `${BASE_URL}/daftar-anime-2/page/${page}/?type=movie`
    : `${BASE_URL}/daftar-anime-2/?type=movie`,
  // Complete
  complete: (page) => page > 1
    ? `${BASE_URL}/daftar-anime-2/page/${page}/?status=completed`
    : `${BASE_URL}/daftar-anime-2/?status=completed`,
};

// Ekstrak slug dari URL samehadaku
// URL bisa: /anime/slime-s4/ atau /slime-s4-episode-14/
function extractAnimeSlug(url) {
  if (!url) return '';
  // Prioritas: /anime/[slug]/
  const animeMatch = url.match(/\/anime\/([^\/]+)\/?/);
  if (animeMatch) return animeMatch[1];
  // Fallback: ambil path terakhir
  const parts = url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || '';
}

// Parse artikel dari halaman Samehadaku (format WordPress)
function parseArticles($, articles) {
  const results = [];
  articles.each((_, el) => {
    const $el = $(el);

    // Link utama artikel — biasanya di h2 a atau di wrapper a
    const linkEl = $el.find('h2 a').first();
    const link = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
    const title = linkEl.text().trim() || $el.find('a').first().attr('title') || $el.find('h2').text().trim() || '';

    // Gambar — bisa di data-src (lazy load) atau src
    const imgEl = $el.find('img').first();
    const image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';

    // Episode info — ada di bold atau span khusus
    const episodeText = $el.find('strong').filter((_, e) => {
      return $(e).prev('strong').length === 0; // Ambil yang pertama berisi "Episode"
    }).first().text().trim() || '';
    
    // Coba ambil nomor episode dari teks artikel
    const epMatch = $el.text().match(/Episode\s+(\d+)/i);
    const episode = epMatch ? `Episode ${epMatch[1]}` : '';

    // Waktu rilis
    const released = $el.find('time, .released, [class*="time"], [class*="date"]').first().text().trim();

    if (title && link) {
      // Pastikan link mengarah ke halaman anime (bukan episode)
      // Kalau link adalah episode, ubah ke halaman anime
      let animeLink = link;
      let animeSlug = extractAnimeSlug(link);
      
      // Jika URL adalah episode (mengandung -episode-), coba ambil slug anime dari breadcrumb atau teks
      // Untuk list terbaru, link langsung ke halaman anime (/anime/slug/)
      
      results.push({
        title,
        slug: animeSlug,
        image,
        episode: episode || null,
        released: released || null,
        url: animeLink,
      });
    }
  });
  return results;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // cache 5 menit
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'ongoing', page = '1' } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const urlFn = TYPE_URLS[type] || TYPE_URLS.ongoing;
  const targetUrl = urlFn(pageNum);

  try {
    const { data } = await axios.get(targetUrl, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(data);

    let results = [];

    // ===== ANIME TERBARU =====
    // Halaman /anime-terbaru/ : artikel berbentuk list dengan h2 a dan img
    // Setiap item: link ke halaman ANIME (/anime/slug/), bukan ke episode
    if (type === 'ongoing') {
      // Selector utama: artikel di halaman terbaru
      // Format: <article> dengan <h2><a href="/anime/slug/">Title</a></h2> <strong>Episode</strong> <img>
      const articles = $('article, .post, .animepost');
      results = parseArticles($, articles);

      // Jika masih kosong, coba selector lebih spesifik dari markdown yang kita dapat
      if (!results.length) {
        // Dari hasil fetch: setiap item punya "## [Title](url)" dan "Episode N"
        $('h2').each((_, h2) => {
          const a = $(h2).find('a');
          const link = a.attr('href') || '';
          const title = a.text().trim();
          // Cari image yang berdekatan
          const parent = $(h2).parent();
          const image = parent.find('img').attr('src') || parent.find('img').attr('data-src') || '';
          // Cari episode info
          const bodyText = parent.text();
          const epMatch = bodyText.match(/Episode\s+(\d+)/i);
          
          if (title && link && link.includes('/anime/')) {
            results.push({
              title,
              slug: extractAnimeSlug(link),
              image,
              episode: epMatch ? `Ep ${epMatch[1]}` : null,
              url: link,
            });
          }
        });
      }
    }

    // ===== DAFTAR ANIME (popular / movie / complete) =====
    else {
      // Halaman daftar anime punya card anime
      const articles = $('article, .animepost, .bsx, .bs');
      results = parseArticles($, articles);

      if (!results.length) {
        // Fallback: cari semua link ke /anime/
        $('a[href*="/anime/"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const title = $(el).attr('title') || $(el).text().trim();
          const imgEl = $(el).find('img');
          const image = imgEl.attr('src') || imgEl.attr('data-src') || '';
          const slug = extractAnimeSlug(href);
          
          if (title && slug && !results.find(r => r.slug === slug)) {
            results.push({ title, slug, image, url: href });
          }
        });
      }
    }

    // Bersihkan duplikat berdasarkan slug
    const seen = new Set();
    const unique = results.filter(r => {
      if (!r.slug || seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });

    // Cek next page
    const hasNextPage = !!$('a.next, .next.page-numbers, [class*="next"]').length;

    return res.json({
      results: unique,
      page: pageNum,
      hasNextPage,
      total: unique.length,
      url: targetUrl, // debug info
    });

  } catch (error) {
    console.error('[anime-list]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil daftar anime: ' + error.message, url: targetUrl });
  }
};
