// api/terbaru.js — Proxy ke api-nanas.my.id/api/nonton/samehadaku/terbaru.php
// Returns: anime terbaru dengan pagination
const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { page = '1' } = req.query;

  try {
    const { data } = await axios.get(`${NANAS_BASE}/terbaru.php`, {
      params: { page },
      timeout: 15000,
    });

    if (!data.status) {
      return res.status(500).json({ error: 'API error', detail: data });
    }

    // Normalize output agar konsisten dengan frontend
    const result = data.result;
    const animeList = (result.anime_list || []).map(a => ({
      title: a.title,
      slug: extractSlug(a.url),
      image: a.image,
      episode: a.episodes ? `Ep ${a.episodes}` : null,
      released: a.released,
      url: a.url,
    }));

    return res.json({
      results: animeList,
      page: result.page,
      total_pages: result.total_pages,
      count: result.count,
      hasNextPage: !!result.next_page,
    });

  } catch (error) {
    console.error('[terbaru]', error.message);
    return res.status(500).json({ error: error.message });
  }
};

function extractSlug(url) {
  if (!url) return '';
  const m = url.match(/\/anime\/([^\/]+)\/?/);
  return m ? m[1] : '';
}
