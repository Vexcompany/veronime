// api/anime-detail.js — Vercel Serverless Function
// Scrapes halaman detail anime dari Samehadaku
// URL format: https://v2.samehadaku.how/anime/[slug]/
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug dibutuhkan' });

  // URL detail anime selalu /anime/[slug]/
  const targetUrl = `${BASE_URL}/anime/${slug}/`;

  try {
    const { data } = await axios.get(targetUrl, { headers: HEADERS, timeout: 20000 });
    const $ = cheerio.load(data);

    // ===== TITLE =====
    const title = $('h1.entry-title').text().trim()
      || $('h1').first().text().trim()
      || $('title').text().replace(' Subtitle Indonesia - Samehadaku', '').trim();

    // ===== IMAGE =====
    // Poster biasanya ada di .thumb atau .poster, atau meta og:image
    const image = $('meta[property="og:image"]').attr('content')
      || $('.thumb img, .poster img, .animposx img, .animeinfo img').first().attr('src')
      || $('img[src*="wp-content/uploads"]').first().attr('src')
      || '';

    // ===== SYNOPSIS =====
    // Samehadaku biasanya punya div.entry-content dengan paragraf sinopsis
    // Atau di .synops, .desc, .animedesc
    let synopsis = '';
    const synopsisSelectors = ['.entry-content > p', '.synops p', '.desc p', '.animedesc p', '.synopsis p'];
    for (const sel of synopsisSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 50) { synopsis = text; break; }
    }
    // Fallback: ambil paragraf terpanjang di halaman
    if (!synopsis) {
      let longest = '';
      $('p').each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > longest.length && t.length > 80 && !t.includes('cookie') && !t.includes('Samehadaku')) {
          longest = t;
        }
      });
      synopsis = longest;
    }

    // ===== INFO BOX =====
    // Samehadaku punya tabel/list info di .spe atau .infox
    // Format: <span><b>Status:</b> Ongoing</span>
    const infoMap = {};
    
    // Method 1: .spe span
    $('.spe span').each((_, el) => {
      const text = $(el).text();
      const colonIdx = text.indexOf(':');
      if (colonIdx > -1) {
        const key = text.substring(0, colonIdx).trim().toLowerCase();
        const val = text.substring(colonIdx + 1).trim();
        if (key && val) infoMap[key] = val;
      }
    });

    // Method 2: .infox li atau tabel
    if (!Object.keys(infoMap).length) {
      $('.infox li, .animeinfo li, table.infotable tr').each((_, el) => {
        const text = $(el).text();
        const colonIdx = text.indexOf(':');
        if (colonIdx > -1) {
          const key = text.substring(0, colonIdx).trim().toLowerCase();
          const val = text.substring(colonIdx + 1).trim();
          if (key && val) infoMap[key] = val;
        }
      });
    }

    // Method 3: Dari paragraf dengan bold label
    if (!Object.keys(infoMap).length) {
      $('b, strong').each((_, el) => {
        const label = $(el).text().replace(':', '').trim().toLowerCase();
        const val = $(el).parent().clone().children('b,strong').remove().end().text().trim();
        if (label && val && label.length < 20) infoMap[label] = val;
      });
    }

    // ===== GENRES =====
    const genres = [];
    // Samehadaku punya link genre di .genre-info atau .genxed
    $('a[href*="/genre/"], a[href*="/?genre="], .genre-info a, .genxed a, [itemprop="genre"] a').each((_, el) => {
      const g = $(el).text().trim();
      if (g && g.length < 30 && !genres.includes(g)) genres.push(g);
    });

    // ===== EPISODE LIST =====
    // Samehadaku: episode list ada di #list-eps atau .episodelist
    // Format: <li><a href="/anime-title-episode-N/">Episode N</a></li>
    const episodes = [];

    // Selector utama
    const epSelectors = [
      '#list-eps li a',
      '.episodelist li a',
      '.eplist li a',
      '.eps li a',
      '.bxcl li a',
      '.eplister li a',
    ];

    for (const sel of epSelectors) {
      const epEls = $(sel);
      if (epEls.length > 0) {
        epEls.each((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().trim() || $(el).attr('title') || '';
          if (href && href.includes(BASE_URL)) {
            // Extract nomor episode dari URL atau teks
            const numFromUrl = href.match(/episode[- ](\d+)/i);
            const numFromText = text.match(/(\d+)/);
            const num = numFromUrl ? numFromUrl[1] : (numFromText ? numFromText[1] : '');
            episodes.push({
              title: text || `Episode ${num}`,
              number: num,
              url: href,
            });
          }
        });
        if (episodes.length > 0) break;
      }
    }

    // Fallback: cari semua link episode di halaman (link yang mengandung slug + "episode")
    if (!episodes.length) {
      const animeSlugBase = slug.replace(/-season-\d+$/, '');
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        // Link episode: berisi nama anime + "-episode-"
        if (href.includes('-episode-') && href.includes(BASE_URL)) {
          const text = $(el).text().trim();
          const numMatch = href.match(/episode[- ](\d+)/i) || text.match(/(\d+)/);
          const num = numMatch ? numMatch[1] : '';
          // Hindari duplikat
          if (!episodes.find(e => e.url === href)) {
            episodes.push({
              title: text || `Episode ${num}`,
              number: num,
              url: href,
            });
          }
        }
      });
    }

    // Sort episode numerik ascending
    episodes.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    const result = {
      title,
      slug,
      image,
      synopsis,
      genres,
      status: infoMap['status'] || infoMap['state'] || null,
      type: infoMap['type'] || infoMap['tipe'] || null,
      totalEpisodes: infoMap['episodes'] || infoMap['episode'] || infoMap['total episode'] || null,
      season: infoMap['season'] || null,
      studio: infoMap['studio'] || null,
      score: infoMap['score'] || infoMap['skor'] || infoMap['rating'] || null,
      titleJp: infoMap['japanese'] || infoMap['judul jepang'] || infoMap['jp'] || null,
      duration: infoMap['duration'] || infoMap['durasi'] || null,
      episodes,
      debug: { infoMap, episodeCount: episodes.length, url: targetUrl },
    };

    return res.json(result);

  } catch (error) {
    console.error('[anime-detail]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil detail anime: ' + error.message, url: targetUrl });
  }
};
