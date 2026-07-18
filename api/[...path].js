// api/[...path].js — SATU-satunya serverless function (hemat kuota Vercel Hobby).
// Catch-all route: /api/:route -> handler di api/_lib/handlers.js
//   /api/home | /api/detail | /api/episode | /api/search
//   /api/explore | /api/genres | /api/proxy | /api/debug | /api
const handlers = require('./_lib/handlers');
const { setCors, sendError } = require('./_lib/http');

// Deteksi segmen route secara robust:
//  1. query param catch-all (kalau platform mengisi)
//  2. fallback: parse dari pathname URL asli (paling reliable)
function getRouteParts(req) {
  const q = req.query?.path;
  if (q) {
    const parts = [].concat(q).filter(Boolean);
    // Abaikan kalau isinya nama file itu sendiri (platform rewrite ke literal path)
    if (parts.length && !/^\[\.\.\./.test(String(parts[0]))) return parts;
  }
  try {
    const u = new URL(req.url || '', 'http://localhost');
    return u.pathname.replace(/^\/api\/?/i, '').split('/').filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const parts = getRouteParts(req);
  const route = (parts[0] || 'index').toLowerCase();
  const handler = handlers[route];

  if (!handler) {
    return res.status(404).json({
      error: `Route "/api/${parts.join('/')}" tidak ditemukan`,
      available: Object.keys(handlers),
    });
  }

  try {
    return await handler(req, res);
  } catch (error) {
    return sendError(res, route, error);
  }
};
