import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import VideoPlayer from '../components/VideoPlayer';
import { fetchDetail, fetchEpisode, externalUrl } from '../utils/api';

export default function AnimeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEp, setSelectedEp] = useState(null);   // number
  const [epData, setEpData] = useState(null);           // response /api/episode
  const [activeStream, setActiveStream] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [epPage, setEpPage] = useState(0);
  const playerRef = useRef(null);
  const EP_PER_PAGE = 60;

  useEffect(() => {
    setLoading(true); setError(null);
    setAnime(null); setSelectedEp(null); setEpData(null); setActiveStream(null);
    fetchDetail(slug)
      .then(setAnime)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadEpisode = (num) => {
    if (num == null) return;
    setSelectedEp(num);
    setStreamLoading(true);
    setStreamError('');
    setEpData(null);
    setActiveStream(null);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    fetchEpisode(slug, num)
      .then((d) => {
        setEpData(d);
        const first = d.streams?.[0] || null;
        setActiveStream(first);
        if (!first) setStreamError('Stream terkunci atau belum tersedia untuk episode ini.');
      })
      .catch((e) => setStreamError('Gagal memuat stream: ' + e.message))
      .finally(() => setStreamLoading(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center"><div className="spinner mx-auto mb-4"/>
        <p className="font-mono text-xs text-slate-v tracking-widest">LOADING...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center border-glow rounded p-8 max-w-sm">
        <p className="font-orbitron text-cyan-neon mb-2">ERROR</p>
        <p className="text-slate-v text-sm mb-4 font-mono">{error}</p>
        <button onClick={() => navigate(-1)} className="cyber-tag cursor-pointer hover:text-cyan-neon">← BACK</button>
      </div>
    </div>
  );

  if (!anime) return null;

  // Movie tanpa daftar episode -> tetap tampilkan 1 tombol "Full Movie"
  const episodes = anime.episodes?.length
    ? anime.episodes
    : (anime.type === 'MOVIE' || anime.totalEpisodes === 1
      ? [{ number: 1, title: 'Full Movie', date: null }]
      : []);
  const totalPages = Math.ceil(episodes.length / EP_PER_PAGE);
  const displayEps = episodes.slice(epPage * EP_PER_PAGE, (epPage + 1) * EP_PER_PAGE);

  // Kelompokkan streams per kualitas
  const streams = epData?.streams || [];
  const qualityGroups = streams.reduce((acc, s) => {
    const q = s.quality || 'default';
    (acc[q] = acc[q] || []).push(s);
    return acc;
  }, {});
  const qualityOrder = Object.keys(qualityGroups).sort((a, b) => {
    if (a === 'default') return 1;
    if (b === 'default') return -1;
    return parseInt(a) - parseInt(b);
  });

  const downloads = epData?.downloads || [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-mono text-xs text-slate-v">
        <button onClick={() => navigate('/')} className="hover:text-cyan-neon transition-colors">HOME</button>
        <span>/</span>
        <span className="text-ice/60 line-clamp-1">{anime.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* ===== KIRI ===== */}
        <div className="lg:sticky lg:top-24 self-start">
          {anime.image ? (
            <div className="rounded overflow-hidden border-glow mb-5 holo-shimmer scanline-overlay"
              style={{ boxShadow: '0 0 40px rgba(0,194,255,0.15)' }}>
              <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover"/>
            </div>
          ) : (
            <div className="rounded border border-slate-v mb-5 aspect-[2/3] bg-navy flex items-center justify-center">
              <span className="font-mono text-xs text-slate-v">NO IMAGE</span>
            </div>
          )}

          <div className="space-y-2.5">
            {[
              ['STATUS',   anime.status],
              ['TYPE',     anime.type],
              ['STUDIO',   anime.studio],
              ['RILIS',    anime.released || anime.year],
              ['SCORE',    anime.score != null ? `★ ${anime.score}` : null],
              ['TOTAL EP', anime.totalEpisodes],
            ].filter(([,v]) => v).map(([label, val]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="font-mono text-xs text-slate-v w-20 shrink-0">{label}</span>
                <span className="text-xs text-ice/80">{val}</span>
              </div>
            ))}
            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {anime.genres.map((g,i) => (
                  <button key={i} onClick={() => navigate(`/explore?genres=${encodeURIComponent(String(g).toLowerCase().replace(/\s+/g, '-'))}`)}
                    className="cyber-tag cursor-pointer hover:text-cyan-neon">{g}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== KANAN ===== */}
        <div>
          <h1 className="font-orbitron font-black text-xl md:text-3xl text-ice mb-1 leading-tight glow-cyan">
            {anime.title}
          </h1>

          {anime.synopsis && (
            <div className="mt-4 mb-6 p-4 bg-navy/60 rounded border border-slate-v/30">
              <p className="font-mono text-xs text-cyan-neon mb-2 tracking-wider">SYNOPSIS</p>
              <p className="text-sm text-ice/70 leading-relaxed whitespace-pre-line">{anime.synopsis}</p>
            </div>
          )}

          {/* ===== TRAILER ===== */}
          {anime.trailer && !selectedEp && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
                <h2 className="font-orbitron font-bold text-sm tracking-wider">TRAILER</h2>
              </div>
              <div className="relative w-full aspect-video bg-black rounded overflow-hidden border border-slate-v">
                <iframe
                  src={anime.trailer.includes('youtube') ? anime.trailer.replace('watch?v=', 'embed/') : anime.trailer}
                  title="Trailer"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* ===== PLAYER ===== */}
          <div ref={playerRef} className="mb-8">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
              <h2 className="font-orbitron font-bold text-sm tracking-wider">
                {selectedEp != null ? `EPISODE ${selectedEp}` : 'VIDEO PLAYER'}
              </h2>
              {streamLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-cyan-neon border-t-transparent rounded-full animate-spin"/>
                  <span className="font-mono text-xs text-slate-v">LOADING STREAM...</span>
                </div>
              )}
              {/* Prev / Next */}
              {selectedEp != null && !streamLoading && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    disabled={epData?.prev == null}
                    onClick={() => loadEpisode(epData?.prev)}
                    className="ep-btn rounded px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
                    ‹ PREV
                  </button>
                  <button
                    disabled={epData?.next == null}
                    onClick={() => loadEpisode(epData?.next)}
                    className="ep-btn rounded px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
                    NEXT ›
                  </button>
                </div>
              )}
            </div>

            {streamLoading ? (
              <div className="w-full aspect-video bg-abyss border border-slate-v rounded flex flex-col items-center justify-center gap-3">
                <div className="spinner"/>
                <p className="font-mono text-xs text-slate-v">FETCHING STREAM...</p>
              </div>
            ) : streamError ? (
              <div className="w-full aspect-video bg-abyss border border-red-900/40 rounded flex flex-col items-center justify-center gap-4 p-4">
                <svg className="w-10 h-10 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <p className="font-mono text-xs text-red-400 text-center">{streamError}</p>
                {selectedEp != null && (
                  <button onClick={() => loadEpisode(selectedEp)}
                    className="cyber-tag cursor-pointer hover:text-cyan-neon">↺ RETRY</button>
                )}
              </div>
            ) : (
              <VideoPlayer
                src={activeStream?.url || ''}
                embed={activeStream?.kind === 'embed'}
                title={`${anime.title}${selectedEp != null ? ` - Ep ${selectedEp}` : ''}`}
                onError={() => setStreamError('Video error. Coba mirror lain di bawah.')}
              />
            )}

            {/* ===== MIRROR SELECTOR ===== */}
            {!streamLoading && streams.length > 0 && (
              <div className="mt-4 p-4 bg-navy/40 rounded border border-slate-v/30">
                <p className="font-mono text-xs text-slate-v mb-3 tracking-wider">SERVER VIDEO / MIRROR</p>
                <div className="flex flex-col gap-3">
                  {qualityOrder.map((q) => (
                    <div key={q} className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-v/60 w-16 shrink-0">
                        {q === 'default' ? 'Default' : q.toUpperCase()}
                      </span>
                      {qualityGroups[q].map((s) => (
                        <button key={s.id} onClick={() => setActiveStream(s)}
                          className={`ep-btn rounded px-3 py-1.5 transition-all text-xs ${
                            activeStream?.id === s.id ? 'active' : ''
                          }`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== DOWNLOAD LINKS ===== */}
            {!streamLoading && downloads.length > 0 && (
              <div className="mt-4 p-4 bg-navy/40 rounded border border-slate-v/30">
                <p className="font-mono text-xs text-slate-v mb-3 tracking-wider">
                  DOWNLOAD EPISODE {selectedEp}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {downloads.map((d, i) => (
                    <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                      className="ep-btn rounded px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:border-cyan-neon hover:text-cyan-neon">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                      {d.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== EPISODE LIST ===== */}
          {episodes.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
                  <h2 className="font-orbitron font-bold text-sm tracking-wider">EPISODES</h2>
                  <span className="font-mono text-xs text-slate-v">{episodes.length} EPS</span>
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: totalPages }).map((_,i) => (
                      <button key={i} onClick={() => setEpPage(i)}
                        className={`font-mono text-xs px-2.5 py-1 border rounded transition-colors ${
                          epPage===i
                            ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                            : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
                        }`}>
                        {i*EP_PER_PAGE+1}–{Math.min((i+1)*EP_PER_PAGE, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {displayEps.map((ep, i) => (
                  <button key={i} onClick={() => loadEpisode(ep.number)}
                    title={ep.date || ep.title}
                    className={`ep-btn rounded py-2 text-center transition-all ${
                      selectedEp === ep.number ? 'active' : ''
                    }`}>
                    {ep.number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== RELATED ===== */}
          {anime.related?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
                <h2 className="font-orbitron font-bold text-sm tracking-wider">ANIME TERKAIT</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {anime.related.map((rel, i) => (
                  <AnimeCard key={i} anime={rel}/>
                ))}
              </div>
            </div>
          )}

          {/* Link ke sumber */}
          <div className="mt-10 text-right">
            <a href={externalUrl({ url: `/anime/${anime.slug}` })} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs text-slate-v/50 hover:text-cyan-neon transition-colors">
              SOURCE: ANIBIPLAY ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
