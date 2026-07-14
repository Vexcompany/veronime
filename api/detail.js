// api/detail.js — Proxy ke api-nanas.my.id/api/nonton/samehadaku/detail.php
// Returns: detail anime + episode list
const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });

  const animeUrl = `https://v2.samehadaku.how/anime/${slug}/`;

  try {
    const { data } = await axios.get(`${NANAS_BASE}/detail.php`, {
      params: { url: animeUrl },
      timeout: 15000,
    });

    if (!data.status) {
      return res.status(500).json({ error: 'API error', detail: data });
    }

    const r = data.result;

    // Normalize episodes — strip HTML dari date field
    const episodes = (r.episodes || []).map(ep => ({
      number: ep.number,
      title: ep.title || `Episode ${ep.number}`,
      url: ep.url,
      date: ep.date ? ep.date.replace(/<[^>]*>/g, '').trim() : '',
      // Slug episode untuk navigasi
      slug: extractEpSlug(ep.url),
    }));

    // Sort ascending by number
    episodes.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    return res.json({
      title: r.title,
      image: r.image,
      synopsis: r.synopsis,
      genres: r.genres || [],
      status: r.status,
      type: r.type,
      season: r.season,
      studio: r.studio,
      released: r.released,
      totalEpisodes: r.episodes_count,
      episodes,
      related: (r.related || []).map(rel => ({
        title: rel.title,
        slug: extractSlug(rel.url),
        image: rel.image,
        url: rel.url,
      })),
    });

  } catch (error) {
    console.error('[detail]', error.message);
    return res.status(500).json({ error: error.message });
  }
};

function extractSlug(url) {
  if (!url) return '';
  const m = url.match(/\/anime\/([^\/]+)\/?/);
  return m ? m[1] : '';
}

function extractEpSlug(url) {
  if (!url) return '';
  const m = url.match(/\/([^\/]+)\/?$/);
  return m ? m[1] : '';
}
