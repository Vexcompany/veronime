// api/search.js — Vercel Serverless Function
// Search di Samehadaku menggunakan WordPress search (?s=query)
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': BASE_URL,
};

function extractAnimeSlug(url) {
  if (!url) return '';
  const animeMatch = url.match(/\/anime\/([^\/]+)\/?/);
  if (animeMatch) return animeMatch[1];
  const parts = url.replace(/\/$/, '').split('/');
  return parts[parts.length - 1] || '';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query minimal 2 karakter' });

  // WordPress search endpoint
  const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(q)}`;

  try {
    const { data } = await axios.get(searchUrl, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const results = [];
    const seen = new Set();

    // Method 1: artikel hasil pencarian
    $('article, .animepost, .post').each((_, el) => {
      const $el = $(el);
      const linkEl = $el.find('h2 a, h1 a').first();
      const link = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
      const title = linkEl.text().trim() || $el.find('a').first().attr('title') || '';
      const imgEl = $el.find('img').first();
      const image = imgEl.attr('src') || imgEl.attr('data-src') || '';
      const slug = extractAnimeSlug(link);

      if (title && link && slug && !seen.has(slug)) {
        seen.add(slug);
        results.push({ title, slug, image, url: link });
      }
    });

    // Method 2: semua link ke /anime/ yang ada di halaman
    if (results.length === 0) {
      $('a[href*="/anime/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).attr('title') || $(el).text().trim();
        const slug = extractAnimeSlug(href);
        const image = $(el).find('img').attr('src') || '';

        if (title && slug && !seen.has(slug) && !href.includes('page')) {
          seen.add(slug);
          results.push({ title, slug, image, url: href });
        }
      });
    }

    return res.json({ results, query: q, total: results.length });
  } catch (error) {
    console.error('[search]', error.message);
    return res.status(500).json({ error: 'Gagal mencari: ' + error.message });
  }
};
