// api/stream.js — Scrape halaman episode Samehadaku, ambil link Pixeldrain
// Pixeldrain dipilih karena linknya permanen (tidak expire)
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL,
};

// Kualitas yang diinginkan, urutan prioritas
const QUALITY_PRIORITY = ['1080', '720', '480', '360', '240'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Parameter url dibutuhkan' });
  if (!url.includes('samehadaku')) return res.status(400).json({ error: 'URL harus dari samehadaku.how' });

  try {
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(html);

    const pixeldrainLinks = [];

    // === METHOD 1: .download-eps (selector utama Samehadaku) ===
    // Struktur: <div class="download-eps"><ul><li><strong>720p</strong><a href="pixeldrain...">Pixeldrain</a></li></ul>
    $('.download-eps li').each((_, li) => {
      const quality = $(li).find('strong, b').first().text().trim() || 'Unknown';
      $(li).find('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (href.includes('pixeldrain.com')) {
          const match = href.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
          if (match) {
            pixeldrainLinks.push({
              quality,
              fileId: match[2],
              streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
            });
          }
        }
      });
    });

    // === METHOD 2: Semua link pixeldrain di halaman ===
    if (!pixeldrainLinks.length) {
      $('a[href*="pixeldrain.com"]').each((_, a) => {
        const href = $(a).attr('href') || '';
        const match = href.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
        const quality = $(a).closest('li').find('strong, b').first().text().trim()
          || $(a).prev('strong, b').text().trim()
          || 'Unknown';
        if (match) {
          pixeldrainLinks.push({
            quality,
            fileId: match[2],
            streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
          });
        }
      });
    }

    // === METHOD 3: Iframe embed pixeldrain ===
    if (!pixeldrainLinks.length) {
      $('iframe[src*="pixeldrain"]').each((_, iframe) => {
        const src = $(iframe).attr('src') || $(iframe).attr('data-src') || '';
        const match = src.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
        if (match) {
          pixeldrainLinks.push({
            quality: 'Embed',
            fileId: match[2],
            streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
          });
        }
      });
    }

    // === PILIH KUALITAS TERBAIK ===
    let chosen = null;
    for (const q of QUALITY_PRIORITY) {
      chosen = pixeldrainLinks.find(l => l.quality && l.quality.includes(q));
      if (chosen) break;
    }
    if (!chosen && pixeldrainLinks.length > 0) chosen = pixeldrainLinks[0];

    // === INFO EPISODE: judul + navigasi prev/next ===
    const title = $('h1.entry-title, h1').first().text().trim()
      || $('title').text().replace(' Sub Indo - Samehadaku', '').trim();
    const prevUrl = $('.nvs.nvp a, .prev-post a, .previous a').attr('href') || null;
    const nextUrl = $('.nvs.nvn a, .next-post a, .next-ep a').attr('href') || null;

    return res.json({
      success: !!chosen,
      player_src: chosen?.streamUrl || '',
      chosen_quality: chosen?.quality || '',
      all_sources: pixeldrainLinks.map(l => ({
        quality: l.quality,
        url: l.streamUrl,
        fileId: l.fileId,
      })),
      title,
      navigation: { prev: prevUrl, next: nextUrl },
    });

  } catch (error) {
    console.error('[stream]', error.message);
    return res.status(500).json({ error: 'Gagal scrape halaman episode: ' + error.message });
  }
};
