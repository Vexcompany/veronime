// api/search.js — Proxy ke api-nanas.my.id/api/nonton/samehadaku/search.php
const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query minimal 2 karakter' });

  try {
    const { data } = await axios.get(`${NANAS_BASE}/search.php`, {
      params: { q },
      timeout: 15000,
    });

    if (!data.status) {
      return res.status(500).json({ error: 'API error' });
    }

    const results = (data.result.results || []).map(a => ({
      title: a.title,
      slug: extractSlug(a.url),
      image: a.image,
      score: a.score,
      status: a.status,
      synopsis: a.synopsis,
      genres: a.genres || [],
      url: a.url,
    }));

    return res.json({ results, total: data.result.count, query: q });

  } catch (error) {
    console.error('[search]', error.message);
    return res.status(500).json({ error: error.message });
  }
};

function extractSlug(url) {
  if (!url) return '';
  const m = url.match(/\/anime\/([^\/]+)\/?/);
  return m ? m[1] : '';
}
