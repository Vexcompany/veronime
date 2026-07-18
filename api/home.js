// api/home.js — Homepage sections dari AnibiPlay
// GET /api/home
// Response: { hero, sections: [{ key, title, tag, viewAll, category, items[] }] }
const { getHomepage } = require('./_lib/anibiplay');
const { buildHomeSections } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.HOME / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let payload = cacheGet('home');
    if (!payload) {
      const home = await getHomepage();
      const sections = buildHomeSections(home._props || home);

      // Hero: prioritas featured[0] -> ongoing[0] -> latestUpdates[0]
      const pick = (key) => sections.find((s) => s.key === key)?.items?.[0];
      const hero = pick('featured') || pick('ongoing') || pick('latestUpdates') || sections[0]?.items?.[0] || null;

      payload = { hero, sections, source: 'anibiplay' };
      cacheSet('home', payload, TTL.HOME);
    }
    return res.json(payload);
  } catch (error) {
    return sendError(res, 'Gagal mengambil homepage', error);
  }
};
