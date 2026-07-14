// api/home-data.js — Vercel Serverless Function
// Scrapes halaman utama Samehadaku: Top 10 minggu ini + Anime Terbaru
// Ini adalah cara paling reliable karena langsung dari homepage
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL,
};

function extractAnimeSlug(url) {
  if (!url) return '';
  const m = url.match(/\/anime\/([^\/]+)\/?/);
  return m ? m[1] : '';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { data: html } = await axios.get(BASE_URL, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(html);

    // ===== TOP 10 MINGGU INI =====
    // Dari markdown: link ke /anime/slug/ dengan gambar dan rating
    const top10 = [];
    // Selector: area top10 — biasanya ada di .top10, #top10, atau section dengan h3 "Top 10"
    // Dari halaman yang kita fetch: ada list dengan gambar, ranking (TOP1..TOP10), dan link /anime/
    // Coba beberapa selector
    $('a[href*="/anime/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const slug = extractAnimeSlug(href);
      if (!slug) return;
      // Cari parent dengan gambar
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src')
        || $(el).closest('li, div').find('img').attr('src') || '';
      const title = $(el).attr('title') || $(el).text().trim()
        || $(el).find('img').attr('alt') || '';
      const rank = $(el).find('[class*="top"], [class*="rank"], strong').text().trim();
      
      if (title && slug && !top10.find(t => t.slug === slug)) {
        top10.push({ title, slug, image: img, rank, url: href });
      }
      if (top10.length >= 10) return false; // stop after 10
    });

    // ===== ANIME TERBARU =====
    // Dari homepage: section "Anime Terbaru" dengan article > h2 a + img
    const terbaru = [];
    // Dari markdown yang kita dapat tadi, setiap entry punya:
    // [Title](url) + **Episode** N + **Posted by** + **Released on**
    $('article, .post, .animpost, .animepost').each((_, el) => {
      const $el = $(el);
      const linkEl = $el.find('h2 a').first();
      const href = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
      const title = linkEl.text().trim() || linkEl.attr('title') || $el.find('a').first().attr('title') || '';
      const imgEl = $el.find('img').first();
      const image = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
      const slug = extractAnimeSlug(href);
      // Episode number dari bold/strong
      const epMatch = $el.text().match(/Episode\s+(\d+)/i);
      const episode = epMatch ? `Ep ${epMatch[1]}` : null;
      // Released time
      const released = $el.find('time, .time, .date').first().text().trim() || null;

      if (title && href && slug) {
        terbaru.push({ title, slug, image, episode, released, url: href });
      }
    });

    // Fallback jika article kosong — parse dari heading list
    if (!terbaru.length) {
      $('h2, h3').each((_, el) => {
        const a = $(el).find('a');
        const href = a.attr('href') || '';
        const title = a.text().trim();
        const slug = extractAnimeSlug(href);
        const parent = $(el).parent();
        const image = parent.find('img').attr('src') || parent.find('img').attr('data-src') || '';
        const bodyText = parent.text();
        const epMatch = bodyText.match(/Episode\s+(\d+)/i);

        if (title && href.includes('/anime/') && slug) {
          terbaru.push({
            title,
            slug,
            image,
            episode: epMatch ? `Ep ${epMatch[1]}` : null,
            url: href,
          });
        }
      });
    }

    // Deduplicate terbaru
    const seenTerbaru = new Set();
    const uniqueTerbaru = terbaru.filter(a => {
      if (seenTerbaru.has(a.slug)) return false;
      seenTerbaru.add(a.slug);
      return true;
    });

    return res.json({
      top10: top10.slice(0, 10),
      terbaru: uniqueTerbaru.slice(0, 20),
    });

  } catch (error) {
    console.error('[home-data]', error.message);
    return res.status(500).json({ error: 'Gagal memuat data home: ' + error.message });
  }
};
