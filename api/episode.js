// api/episode.js — Detail episode: mirror stream embed + download + semua episode
// GET /api/episode?slug=sasaki-to-pii-chan&ep=1
const { getEpisodeDetails } = require('./_lib/anibiplay');
const { normalizeEpisodePage } = require('./_lib/normalize');
const { setCors, cacheControl, sendError, cacheGet, cacheSet, TTL } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  cacheControl(res, TTL.EPISODE / 1000);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug, ep } = req.query;
  if (!slug || !ep) return res.status(400).json({ error: "Parameter 'slug' dan 'ep' dibutuhkan" });

  try {
    const cacheKey = `episode:${slug}:${ep}`;
    let payload = cacheGet(cacheKey);
    if (!payload) {
      const raw = await getEpisodeDetails(slug, ep);
      if (raw?.error) return res.status(404).json({ error: raw.error });
      if (!raw?.episode) return res.status(404).json({ error: `Episode ${ep} dari "${slug}" tidak ditemukan` });
      payload = normalizeEpisodePage(raw, slug, String(ep));

      // Navigasi prev/next berdasarkan daftar episode
      const nums = (payload.allEpisodes || []).map((e) => e.number).sort((a, b) => a - b);
      const cur = payload.episode?.number;
      if (cur != null && nums.length) {
        payload.prev = [...nums].reverse().find((n) => n < cur) ?? null;
        payload.next = nums.find((n) => n > cur) ?? null;
      } else {
        payload.prev = null;
        payload.next = null;
      }

      cacheSet(cacheKey, payload, TTL.EPISODE);
    }
    return res.json(payload);
  } catch (error) {
    return sendError(res, 'Gagal mengambil data episode', error);
  }
};
