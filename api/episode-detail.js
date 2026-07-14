// api/episode-detail.js — Vercel Serverless Function
// Scrapes semua sumber stream dari halaman episode Samehadaku
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Referer': BASE_URL,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL dibutuhkan' });
  if (!url.includes('samehadaku')) return res.status(400).json({ error: 'URL tidak valid' });

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(data);

    const title = $('h1.entry-title, h1').first().text().trim()
      || $('title').text().replace(' Sub Indo - Samehadaku', '').trim();

    // Kumpulkan semua link download per resolusi
    const downloads = [];
    $('.download-eps li, .dlbod li, .download li').each((_, el) => {
      const $el = $(el);
      const resolution = $el.find('strong, b').first().text().trim();
      const links = [];
      $el.find('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        const host = $(a).text().trim();
        links.push({ host, href });
      });
      if (links.length) downloads.push({ resolution, links });
    });

    // Semua link Pixeldrain
    const pixeldrainLinks = [];
    $('a[href*="pixeldrain.com"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
      const label = $(el).closest('li').find('strong, b').first().text().trim() || $(el).text().trim();
      if (match) {
        pixeldrainLinks.push({
          label,
          fileId: match[2],
          streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
        });
      }
    });

    // Nav episode
    const prevEp = $('.nvs.nvp a, .prev-post a, a.previous-episode').attr('href') || null;
    const nextEp = $('.nvs.nvn a, .next-post a, a.next-episode').attr('href') || null;

    return res.json({ title, pixeldrainLinks, downloads, navigation: { prev: prevEp, next: nextEp } });
  } catch (error) {
    console.error('[episode-detail]', error.message);
    return res.status(500).json({ error: 'Gagal: ' + error.message });
  }
};
