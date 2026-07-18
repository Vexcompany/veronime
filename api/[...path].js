// api/[...path].js — SATU-satunya serverless function (hemat kuota Vercel Hobby).
// Catch-all route: /api/:route -> handler di api/_lib/handlers.js
//   /api/home | /api/detail | /api/episode | /api/search
//   /api/explore | /api/genres | /api/proxy | /api/debug | /api
const handlers = require('./_lib/handlers');
const { setCors, sendError } = require('./_lib/http');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const parts = [].concat(req.query.path || []);
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
