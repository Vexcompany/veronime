// api/stream.js — Vercel Serverless Function
// Scrapes halaman episode Samehadaku, ekstrak Pixeldrain stream URL
// URL episode format: https://v2.samehadaku.how/[anime-slug]-episode-N/
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL,
};

// Kualitas prioritas
const QUALITY_PRIORITY = ['1080', '720', '480', '360', '240'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL episode dibutuhkan' });

  // Validasi URL
  if (!url.includes('samehadaku')) {
    return res.status(400).json({ error: 'URL harus dari samehadaku.how' });
  }

  try {
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(html);

    const allPixeldrainLinks = [];

    // ===== METHOD 1: .download-eps (seperti contoh Gemini) =====
    // Format: <div class="download-eps"><ul><li><strong>720p</strong><a href="...pixeldrain...">Pixeldrain</a></li></ul></div>
    $('.download-eps li, .dlbod li, .download-box li, .dload li').each((_, el) => {
      const $el = $(el);
      const quality = $el.find('strong, b, .res').first().text().trim() || 'Unknown';
      $el.find('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        const host = $(a).text().trim();
        if (href.includes('pixeldrain.com/u/') || href.includes('pixeldrain.com/l/')) {
          const match = href.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
          if (match) {
            allPixeldrainLinks.push({
              quality,
              host,
              fileId: match[2],
              type: match[1], // u = file, l = list
              streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
            });
          }
        }
      });
    });

    // ===== METHOD 2: Semua link pixeldrain di halaman =====
    if (!allPixeldrainLinks.length) {
      $('a[href*="pixeldrain.com"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const match = href.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
        // Cari kualitas dari parent element
        const quality = $(el).closest('li').find('strong, b, .res').first().text().trim()
          || $(el).prev('strong').text().trim()
          || 'Unknown';
        if (match) {
          allPixeldrainLinks.push({
            quality,
            host: $(el).text().trim() || 'Pixeldrain',
            fileId: match[2],
            type: match[1],
            streamUrl: `https://pixeldrain.com/api/file/${match[2]}`,
          });
        }
      });
    }

    // ===== METHOD 3: Cek iframe embed =====
    let embedSrc = '';
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      // Pixeldrain embed: https://pixeldrain.com/u/ID?theme=...
      if (src.includes('pixeldrain.com')) {
        const match = src.match(/\/(u|l)\/([a-zA-Z0-9]+)/);
        if (match) {
          embedSrc = `https://pixeldrain.com/api/file/${match[2]}`;
          allPixeldrainLinks.push({
            quality: 'Embed',
            fileId: match[2],
            type: match[1],
            streamUrl: embedSrc,
          });
        }
      }
    });

    // ===== PILIH KUALITAS TERBAIK =====
    let chosen = null;
    for (const q of QUALITY_PRIORITY) {
      chosen = allPixeldrainLinks.find(l => l.quality && l.quality.includes(q));
      if (chosen) break;
    }
    // Fallback ke yang pertama
    if (!chosen && allPixeldrainLinks.length > 0) {
      chosen = allPixeldrainLinks[0];
    }

    // ===== INFO EPISODE (judul, prev/next) =====
    const title = $('h1.entry-title, h1').first().text().trim()
      || $('title').text().replace(' Sub Indo - Samehadaku', '').trim();

    const prevEpUrl = $('.nvs.nvp a, .prev-post a, .previous a, a.previous-episode').attr('href') || null;
    const nextEpUrl = $('.nvs.nvn a, .next-post a, .next a, a.next-episode').attr('href') || null;

    return res.json({
      success: !!chosen,
      player_src: chosen ? chosen.streamUrl : '',
      chosen_quality: chosen ? chosen.quality : '',
      all_sources: allPixeldrainLinks.map(l => ({
        quality: l.quality,
        url: l.streamUrl,
      })),
      title,
      navigation: { prev: prevEpUrl, next: nextEpUrl },
    });

  } catch (error) {
    console.error('[stream]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil stream: ' + error.message });
  }
};
