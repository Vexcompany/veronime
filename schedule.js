// api/schedule.js — Proxy ke api-nanas.my.id/api/nonton/samehadaku/schedule.php
// Params: day (monday/tuesday/...), perpage (jumlah yang ditampilkan, 0 = semua)
const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';
const VALID_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { day = 'monday', perpage = '0' } = req.query;
  const dayLower = day.toLowerCase();

  if (!VALID_DAYS.includes(dayLower)) {
    return res.status(400).json({ error: `day harus salah satu dari: ${VALID_DAYS.join(', ')}` });
  }

  try {
    const { data } = await axios.get(`${NANAS_BASE}/schedule.php`, {
      params: { day: dayLower, perpage },
      timeout: 15000,
    });

    if (!data.status) {
      return res.status(500).json({ error: 'API error' });
    }

    const r = data.result;

    // raw_data berisi anime lengkap dengan metadata
    const rawList = r.raw_data || [];
    const perpageNum = parseInt(perpage) || 0;
    const sliced = perpageNum > 0 ? rawList.slice(0, perpageNum) : rawList;

    const animeList = sliced.map(a => ({
      title: a.title,
      slug: a.slug,
      image: a.featured_img_src,
      genres: a.genre ? a.genre.split(', ') : [],
      score: a.east_score,
      type: a.east_type,
      schedule: a.east_schedule,
      time: a.east_time ? a.east_time.replace(/\s/g, '') : '',
      url: a.url,
    }));

    return res.json({
      day: r.day,
      count: animeList.length,
      anime_list: animeList,
    });

  } catch (error) {
    console.error('[schedule]', error.message);
    return res.status(500).json({ error: error.message });
  }
};
