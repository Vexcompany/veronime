// api/debug.js — Utilitas debugging: lihat raw Inertia props dari AnibiPlay.
// GET /api/debug?what=home|detail|episode|explore&slug=...&ep=...&page=...
// Berguna untuk memastikan struktur data sumber tidak berubah.
const anibi = require('./_lib/anibiplay');
const { setCors, sendError } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { what = 'home', slug = '', ep = '1', page = '1', type = '', status = '', search = '', genres = '', sort = '' } = req.query;

  try {
    switch (what) {
      case 'home':
        return res.json(await anibi.getHomepage());
      case 'detail':
        if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });
        return res.json(await anibi.getAnimeDetails(slug));
      case 'episode':
        if (!slug) return res.status(400).json({ error: 'slug dibutuhkan' });
        return res.json(await anibi.getEpisodeDetails(slug, ep));
      case 'explore': {
        const genreList = String(genres).split(',').map((g) => g.trim()).filter(Boolean);
        return res.json(await anibi.explore(page, type, status, search, genreList, sort));
      }
      case 'search': {
        const q = req.query.q || 'naruto';
        return res.json(await anibi.search(q));
      }
      case 'proxy':
        return res.json({ proxy: anibi.getProxy() ? '(configured)' : null, base: anibi.BASE_URL });
      default:
        return res.status(400).json({ error: 'what harus salah satu dari: home, detail, episode, explore, search, proxy' });
    }
  } catch (error) {
    return sendError(res, 'debug', error);
  }
};
