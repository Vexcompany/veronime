// api/proxy.js — Global media proxy
// GET /api/proxy?url=<encoded url>
// Mem-proxy gambar/video agar tidak kena hotlink protection / CORS.
// Hanya GET/HEAD, menolak host privat/localhost. Support Range request.
const axios = require('axios');
const { setCors } = require('./_lib/http');

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|\[?::1\]?$)/i;
const MAX_BYTES = 60 * 1024 * 1024; // 60MB safety cap

// Referer overrides untuk host yang ketat
const REFERER_MAP = [
  [/anilist\.co$/i, 'https://anilist.co/'],
  [/komiku\.org$/i, 'https://komiku.org/'],
  [/mega\.(co\.)?nz$/i, 'https://mega.nz/'],
];

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method tidak didukung' });
  }

  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "Parameter 'url' dibutuhkan" });

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }
  if (!/^https?:$/.test(parsed.protocol)) return res.status(400).json({ error: 'Hanya http/https' });
  if (PRIVATE_HOST.test(parsed.hostname)) return res.status(400).json({ error: 'Host tidak diizinkan' });

  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
    // Teruskan Range untuk video streaming
    if (req.headers.range) headers.Range = req.headers.range;
    // Referer dasar = origin target
    headers.Referer = `${parsed.protocol}//${parsed.host}/`;
    for (const [pattern, ref] of REFERER_MAP) {
      if (pattern.test(parsed.hostname)) headers.Referer = ref;
    }

    const upstream = await axios.get(target, {
      headers,
      responseType: 'stream',
      timeout: 25000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });

    // Teruskan header penting
    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    for (const h of passHeaders) {
      if (upstream.headers[h]) res.setHeader(h, upstream.headers[h]);
    }

    const contentType = upstream.headers['content-type'] || '';
    // Cache gambar lama, video sedang, playlist jangan
    let cacheSeconds = 3600;
    if (/^image\//i.test(contentType)) cacheSeconds = 86400;
    else if (/mpegurl|vnd\.apple/i.test(contentType)) cacheSeconds = 60;
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate`);

    // Safety cap: hentikan relay kalau upstream terlalu besar
    const declared = parseInt(upstream.headers['content-length'] || '0');
    if (declared > MAX_BYTES) {
      upstream.data.destroy();
      return res.status(413).json({ error: 'File terlalu besar untuk di-proxy' });
    }

    res.status(upstream.status);
    if (req.method === 'HEAD') return res.end();
    upstream.data.pipe(res);
    upstream.data.on('error', () => res.end());
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({ error: `Proxy gagal: ${error.message}` });
  }
};
