// scripts/test-scrape.js — Test scraper AnibiPlay dari localhost.
// Jalankan:  node scripts/test-scrape.js
// Butuh: npm install (axios + cheerio sudah ada di root package.json)
const anibi = require('../api/_lib/anibiplay');
const N = require('../api/_lib/normalize');

const ok = (label, data) => console.log(`✅ ${label}`, data);
const fail = (label, e) => console.log(`❌ ${label}:`, e?.message || e);

async function main() {
  console.log('BASE:', anibi.BASE_URL, '| proxy:', anibi.getProxy() || '(none)');

  // 1. Homepage
  try {
    const home = await anibi.getHomepage();
    const sections = N.buildHomeSections(home._props || home);
    ok('homepage sections:', sections.map((s) => `${s.key}(${s.items.length})`).join(', '));
    if (sections[0]) {
      const c = sections[0].items[0];
      ok('  contoh card:', JSON.stringify({ title: c.title, slug: c.slug, image: c.image?.slice(0, 60), episode: c.episode, score: c.score }));
    }
  } catch (e) { fail('homepage', e); }

  // 2. Search
  try {
    const raw = await anibi.search('sasaki');
    const results = N.normalizeCardList(raw);
    ok(`search "sasaki": ${results.length} hasil`, results.slice(0, 2).map((r) => `[${r.category}] ${r.title}`));
  } catch (e) { fail('search', e); }

  // 3. Detail + episode lengkap
  let slug = 'sasaki-to-pii-chan';
  try {
    const raw = await anibi.getAnimeDetails(slug);
    const detail = N.normalizeDetail(raw, slug);
    ok(`detail "${slug}":`, `${detail.title} — ${detail.episodes.length} episode, status=${detail.status}, score=${detail.score}`);
    slug = detail.slug || slug;
  } catch (e) { fail('detail', e); }

  // 4. Episode (mirror stream + download)
  try {
    const raw = await anibi.getEpisodeDetails('sasaki-to-pii-chan', 1);
    const ep = N.normalizeEpisodePage(raw, 'sasaki-to-pii-chan', '1');
    ok('episode 1:', `streams=${ep.streams.length}, downloads=${ep.downloads.length}, allEpisodes=${ep.allEpisodes.length}`);
    if (ep.streams[0]) ok('  stream[0]:', JSON.stringify(ep.streams[0]));
    if (ep.downloads[0]) ok('  download[0]:', JSON.stringify(ep.downloads[0]));
  } catch (e) { fail('episode', e); }

  // 5. Explore paginated + genre
  try {
    const raw = await anibi.explore(2, 'TV', 'completed', '', [], '');
    const { results, pagination } = N.normalizePaginator(raw.animes, 2);
    const genres = N.normalizeGenres(raw.genres);
    ok(`explore page=2 type=TV status=completed: ${results.length} item`, JSON.stringify(pagination));
    ok(`  genres tersedia: ${genres.length}`, genres.slice(0, 5).map((g) => g.label).join(', '));
    if (results[0]) ok('  contoh item:', `${results[0].title} (score=${results[0].score})`);
  } catch (e) { fail('explore', e); }
}

main().then(() => console.log('\nSelesai.')).catch((e) => fail('fatal', e));
