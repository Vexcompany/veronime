// api/anime-detail.js — Vercel Serverless Function
// Scrapes halaman detail anime dari Samehadaku
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://v2.samehadaku.how';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': BASE_URL,
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug dibutuhkan' });

  // Build URL detail anime
  const targetUrl = `${BASE_URL}/${slug}/`;

  try {
    const { data } = await axios.get(targetUrl, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);

    // Title
    const title = $('h1.entry-title, h1.post-title, h1').first().text().trim();
    
    // Image
    const image = $('.thumb img, .poster img, .entry-content img').first().attr('src')
                  || $('img.attachment-post-thumbnail').attr('src') || '';

    // Synopsis
    const synopsis = $('.entry-content p, .synopsis p, [itemprop="description"]').first().text().trim()
                     || $('p').filter((_, el) => $(el).text().length > 100).first().text().trim();

    // Info box (status, tipe, episode, studio, score)
    const infoMap = {};
    $('.spe span, .infox li, .info-content li, .detail-info li').each((_, el) => {
      const label = $(el).find('b, strong, span.lchz').first().text().replace(':', '').trim().toLowerCase();
      const value = $(el).find('a, span:not(.lchz)').first().text().trim()
                    || $(el).clone().children('b, strong, span.lchz').remove().end().text().trim();
      if (label && value) infoMap[label] = value;
    });

    // Genres
    const genres = [];
    $('.genre-info a, .genxed a, [itemprop="genre"] a, .genres a').each((_, el) => {
      const g = $(el).text().trim();
      if (g) genres.push(g);
    });

    // Episode list
    const episodes = [];
    // Samehadaku biasanya punya #list-eps atau .episodelist
    $('#list-eps li a, .episodelist li a, .eplist li a, .episodes-list li a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      // Ambil nomor episode dari teks atau URL
      const numMatch = text.match(/(\d+)/);
      episodes.push({
        title: text,
        number: numMatch ? numMatch[1] : episodes.length + 1,
        url: href,
      });
    });

    // Jika tidak ada dengan selector di atas, coba selector lain
    if (!episodes.length) {
      $('.bxcl li a, .eplist a, ul.episodelist a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim() || $(el).parent().text().trim();
        if (href && href.includes(slug.replace('-episode-', ''))) {
          const numMatch = text.match(/(\d+)/);
          episodes.push({ title: text, number: numMatch ? numMatch[1] : '', url: href });
        }
      });
    }

    // Reverse agar episode 1 di depan
    episodes.reverse();

    const result = {
      title,
      slug,
      image,
      synopsis,
      genres,
      status: infoMap['status'] || infoMap['state'] || null,
      type: infoMap['type'] || infoMap['tipe'] || null,
      totalEpisodes: infoMap['episodes'] || infoMap['episode'] || null,
      season: infoMap['season'] || null,
      studio: infoMap['studio'] || null,
      score: infoMap['score'] || infoMap['skor'] || null,
      titleJp: infoMap['japanese'] || infoMap['judul jepang'] || null,
      episodes,
    };

    return res.json(result);
  } catch (error) {
    console.error('[anime-detail]', error.message);
    return res.status(500).json({ error: 'Gagal mengambil detail anime: ' + error.message });
  }
};
