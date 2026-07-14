// api/poster.js — Ambil poster anime langsung dari og:image halaman Samehadaku
// Lebih cepat dari hit detail API karena hanya baca meta tag
// Cache 1 hari di Vercel CDN
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': BASE_URL,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });

  try {
    // Hanya ambil sebagian kecil HTML — cukup untuk dapat og:image di <head>
    const { data: html } = await axios.get(`${BASE_URL}/anime/${slug}/`, {
      headers: { ...HEADERS, Range: 'bytes=0-4000' },
      timeout: 8000,
      // Paksa hentikan setelah dapat <head>
      maxContentLength: 50000,
    });

    const $ = cheerio.load(html);

    // og:image adalah poster resmi yang diset oleh Samehadaku
    const image = $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('img.wp-post-image').attr('src')
      || '';

    if (!image) return res.status(404).json({ error: 'Poster tidak ditemukan', slug });

    return res.json({ slug, image });

  } catch (error) {
    // Kalau partial content (range request) throw error, coba tanpa range
    try {
      const { data: html } = await axios.get(`${BASE_URL}/anime/${slug}/`, {
        headers: HEADERS,
        timeout: 10000,
        maxContentLength: 200000,
      });
      const $ = cheerio.load(html);
      const image = $('meta[property="og:image"]').attr('content') || '';
      if (image) return res.json({ slug, image });
    } catch {}

    return res.status(500).json({ error: error.message, slug });
  }
};
