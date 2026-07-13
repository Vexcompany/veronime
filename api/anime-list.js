// api/anime-list.js — Vercel Serverless Function
// Scrapes daftar anime dari Samehadaku (ongoing, popular, movie)
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': BASE_URL,
};

const TYPE_URLS = {
  ongoing: (page) => `${BASE_URL}/ongoing-anime/page/${page}/`,
  popular: (page) => `${BASE_URL}/popular-anime/page/${page}/`,
  movie: (page) => `${BASE_URL}/category/movie/page/${page}/`,
  complete: (page) => `${BASE_URL}/complete-anime/page/${page}/`,
};

function extractSlug(url) {
  if (!url) return '';
  // Ambil slug dari URL samehadaku
  const match = url.match(/\/([^\/]+)\/?$/);
  return match ? match[1] : '';
}

function parseAnimeList($, container) {
  const results = [];
  $(container).each((_, el) => {
    const $el = $(el);
    const title = $el.find('.entry-title, h2.entry-title, .post-title, h2 a').first().text().trim()
                  || $el.find('a').first().attr('title') || '';
    const link = $el.find('a').first().attr('href') || '';
    const image = $el.find('img').first().attr('src')
                  || $el.find('img').first().attr('data-src') || '';
    const status = $el.find('.type, .status, .StatusBadge').first().text().trim();
    const episode = $el.find('.episode, .numep, .ep, .Epi').first().text().trim();
    const type = $el.find('.typez, .type2').first().text().trim();

    if (title && link) {
      results.push({
        title,
        slug: extractSlug(link),
        image,
        status: status || null,
        episode: episode || null,
        type: type || null,
        url: link,
      });
    }
  });
  return results;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type = 'ongoing', page = '1' } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const urlFn = TYPE_URLS[type] || TYPE_URLS.ongoing;
  const targetUrl = urlFn(pageNum);

  try {
    const { data } = await axios.get(targetUrl, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    // Coba beberapa selector yang umum di Samehadaku
    let results = parseAnimeList($, '.animepost, .bsx, .animpost, article.bs');
    
    if (!results.length) {
      results = parseAnimeList($, 'article');
    }
    if (!results.length) {
      results = parseAnimeList($, '.post');
    }

    // Cek apakah ada halaman berikutnya
    const hasNextPage = !!$('.next.page-numbers, .next-page, a.next').length;

    return res.json({ results, page: pageNum, hasNextPage, total: results.length });
  } catch (error) {
    console.error('[anime-list]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil daftar anime: ' + error.message });
  }
};
