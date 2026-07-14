// api/poster.js — Ambil URL poster anime dari detail API, dengan caching 1 hari
// Dipakai AnimeCard agar poster yang tampil adalah gambar anime, bukan thumbnail episode
const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Cache agresif — poster anime jarang berubah
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });

  const animeUrl = `https://v2.samehadaku.how/anime/${slug}/`;

  try {
    const { data } = await axios.get(`${NANAS_BASE}/detail.php`, {
      params: { url: animeUrl },
      timeout: 12000,
    });

    if (!data.status || !data.result?.image) {
      return res.status(404).json({ error: 'Poster tidak ditemukan', slug });
    }

    return res.json({ slug, image: data.result.image });

  } catch (error) {
    console.error('[poster]', error.message);
    return res.status(500).json({ error: error.message });
  }
};
