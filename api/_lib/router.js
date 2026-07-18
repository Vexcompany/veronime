// api/_lib/router.js — Router bersama untuk api/index.js & api/[...path].js
const handlers = require('./handlers');
const { setCors, sendError } = require('./http');

// Deteksi route secara robust:
//  1. ?route=... (eksplisit, 100% deterministik — dipakai frontend)
//  2. query.path segments (kalau platform mengisi catch-all)
//  3. segmen pertama pathname URL asli (/api/<route>)
function resolveParts(req) {
  const query = req.query || {};

  if (query.route) return [].concat(query.route).filter(Boolean);

  if (query.path) {
    const parts = [].concat(query.path).filter(Boolean);
    if (parts.length && !/^\[\.\.\./.test(String(parts[0]))) return parts;
  }

  try {
    const u = new URL(req.url || '', 'http://localhost');
    return u.pathname.replace(/^\/api\/?/i, '').split('/').filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = async function routeRequest(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const parts = resolveParts(req);
  const route = (parts[0] || 'index').toLowerCase();
  const handler = handlers[route];

  if (!handler) {
    return res.status(404).json({
      error: `Route "/api/${parts.join('/')}" tidak ditemukan`,
      available: Object.keys(handlers),
    });
  }

  // Marker versi + echo debugging (membantu diagnosis routing di Vercel)
  res.setHeader('X-Veronime-Api', '3');

  try {
    return await handler(req, res);
  } catch (error) {
    return sendError(res, route, error);
  }
};
