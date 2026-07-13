// api/search.js — Vercel Serverless Function
// Scrapes hasil pencarian dari Samehadaku
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': BASE_URL,
};

function extractSlug(url) {
  const match = url?.match(/\/([^\/]+)\/?$/);
  return match ? match[1] : '';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query dibutuhkan' });

  const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(q)}`;

  try {
    const { data } = await axios.get(searchUrl, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    const results = [];
    // Selector hasil pencarian Samehadaku
    $('.animepost, article.bs, .searchlist article, .result-item').each((_, el) => {
      const $el = $(el);
      const link = $el.find('a').first().attr('href') || '';
      const title = $el.find('.entry-title, h2, h3, .post-title').first().text().trim()
                    || $el.find('a').first().attr('title') || '';
      const image = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      const status = $el.find('.type, .status').first().text().trim();

      if (title && link) {
        results.push({ title, slug: extractSlug(link), image, status: status || null, url: link });
      }
    });

    return res.json({ results, query: q, total: results.length });
  } catch (error) {
    console.error('[search]', error.message);
    return res.status(500).json({ error: 'Gagal mencari: ' + error.message });
  }
};
