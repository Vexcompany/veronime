// api/stream.js — Vercel Serverless Function
// Scrapes Samehadaku episode page, extracts Pixeldrain stream URL
const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://v2.samehadaku.how/',
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL dibutuhkan' });

  // Validasi hanya boleh URL samehadaku
  if (!url.includes('samehadaku')) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    let streamUrl = '';
    let allLinks = [];

    // Method 1: .download-eps selector (seperti di contoh Gemini)
    $('.download-eps').find('li').each((_, el) => {
      $(el).find('a').each((_, a) => {
        const href = $(a).attr('href');
        if (href && href.includes('pixeldrain.com/u/')) {
          const match = href.match(/\/u\/([a-zA-Z0-9]+)/);
          if (match) allLinks.push({ type: 'pixeldrain', id: match[1], src: href, label: $(a).text().trim() });
        }
      });
    });

    // Method 2: Semua link pixeldrain di halaman
    if (!allLinks.length) {
      $('a[href*="pixeldrain.com"]').each((_, el) => {
        const href = $(el).attr('href');
        const match = href?.match(/\/u\/([a-zA-Z0-9]+)/);
        if (match) allLinks.push({ type: 'pixeldrain', id: match[1], src: href, label: $(el).text().trim() });
      });
    }

    // Method 3: Cek embed video langsung
    let embedSrc = '';
    $('iframe[src], video[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && (src.includes('pixeldrain') || src.includes('googleapis') || src.includes('drive.google'))) {
        embedSrc = src;
        return false;
      }
    });

    // Pilih kualitas terbaik (prioritas 720p > 480p > 360p)
    const preferredOrder = ['720', '480', '360', '1080'];
    let chosen = null;
    for (const quality of preferredOrder) {
      chosen = allLinks.find(l => l.label.includes(quality));
      if (chosen) break;
    }
    if (!chosen && allLinks.length > 0) chosen = allLinks[0];

    if (chosen) {
      streamUrl = `https://pixeldrain.com/api/file/${chosen.id}`;
    } else if (embedSrc) {
      streamUrl = embedSrc;
    }

    return res.json({
      player_src: streamUrl,
      all_sources: allLinks.map(l => ({
        label: l.label,
        url: `https://pixeldrain.com/api/file/${l.id}`
      })),
      embed_src: embedSrc,
      success: !!streamUrl
    });
  } catch (error) {
    console.error('[stream]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil stream: ' + error.message });
  }
};
