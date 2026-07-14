// api/stream.js — Proxy ke api-nanas.my.id stream endpoint
// Docs: /api/nonton/samehadaku/stream.php?slug=EPISODE_SLUG&server=N
//
// available_servers: 1=Blogspot, 2=VIP, 3=Wibufile 480p, 4=Wibufile 720p,
//                   5=Wibufile 1080p, 6=Mega 480p, 7=Mega 720p, 8=Mega 1080p
//
// Strategi: coba server 5 (Wibufile 1080p) dulu, fallback ke 4, 3, 6, 7, 8
// Wibufile lebih reliable karena direct MP4, Mega butuh auth

const axios = require('axios');

const NANAS_BASE = 'https://api-nanas.my.id/api/nonton/samehadaku';

// Urutan server yang dicoba: Wibufile prioritas, Mega fallback
// Format: { id, label, type }
const SERVER_PRIORITY = [
  { id: '5', label: 'Wibufile 1080p' },
  { id: '4', label: 'Wibufile 720p'  },
  { id: '3', label: 'Wibufile 480p'  },
  { id: '6', label: 'Mega 480p'      },
  { id: '7', label: 'Mega 720p'      },
  { id: '8', label: 'Mega 1080p'     },
];

// Ekstrak slug episode dari URL Samehadaku
// URL: https://v2.samehadaku.how/rakudai-kenja-no-gakuin-musou-episode-1/
function urlToSlug(url) {
  if (!url) return '';
  const m = url.match(/samehadaku\.how\/([^\/]+)\/?$/);
  return m ? m[1] : '';
}

async function fetchServer(slug, serverId) {
  const { data } = await axios.get(`${NANAS_BASE}/stream.php`, {
    params: { slug, server: serverId },
    timeout: 12000,
  });
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Terima: ?url=https://...samehadaku.how/anime-episode-1/
  // atau:   ?slug=anime-episode-1
  // atau:   ?slug=...&server=5 (manual pilih server)
  const { url, slug: slugParam, server: serverParam } = req.query;

  const slug = slugParam || urlToSlug(url);
  if (!slug) return res.status(400).json({ error: 'Parameter slug atau url dibutuhkan' });

  try {
    // Jika server di-specify manual, langsung fetch itu saja
    if (serverParam) {
      const data = await fetchServer(slug, serverParam);
      if (!data.status || !data.result?.stream_url) {
        return res.status(404).json({ error: `Server ${serverParam} tidak tersedia`, slug });
      }
      const r = data.result;
      return res.json({
        success: true,
        player_src: r.stream_url,
        chosen_server: r.server,
        chosen_server_id: serverParam,
        all_servers: r.available_servers || {},
        title: r.title,
      });
    }

    // Auto-fallback: coba server satu per satu sesuai prioritas
    let lastError = '';
    for (const srv of SERVER_PRIORITY) {
      try {
        const data = await fetchServer(slug, srv.id);
        if (data.status && data.result?.stream_url) {
          const r = data.result;
          // Susun semua sumber yang tersedia dari available_servers
          const allSources = Object.entries(r.available_servers || {}).map(([id, label]) => ({
            server_id: id,
            label,
            // URL bisa di-fetch on-demand dari frontend kalau user pilih kualitas lain
          }));
          return res.json({
            success: true,
            player_src: r.stream_url,
            chosen_server: r.server,
            chosen_server_id: srv.id,
            all_servers: r.available_servers || {},
            all_sources: allSources,
            title: r.title,
            slug,
          });
        }
      } catch (e) {
        lastError = e.message;
        // Lanjut ke server berikutnya
      }
    }

    return res.status(404).json({
      success: false,
      error: 'Semua server tidak tersedia untuk episode ini',
      slug,
      last_error: lastError,
    });

  } catch (error) {
    console.error('[stream]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil stream: ' + error.message, slug });
  }
};
