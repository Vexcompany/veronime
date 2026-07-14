import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import VideoPlayer from '../components/VideoPlayer';
import { fetchDetail, fetchStream } from '../utils/api';

export default function AnimeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEp, setSelectedEp] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [streamSources, setStreamSources] = useState([]);
  const [epPage, setEpPage] = useState(0);
  const playerRef = useRef(null);
  const EP_PER_PAGE = 60;

  useEffect(() => {
    setLoading(true); setError(null);
    setAnime(null); setSelectedEp(null); setStreamUrl(''); setStreamSources([]);
    fetchDetail(slug)
      .then(setAnime)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEpisode = async (ep) => {
    if (!ep.url) { setStreamError('URL episode tidak tersedia.'); return; }
    setSelectedEp(ep);
    setStreamLoading(true);
    setStreamError('');
    setStreamUrl('');
    setStreamSources([]);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    try {
      const data = await fetchStream(ep.url);
      if (data.player_src) {
        setStreamUrl(data.player_src);
        setStreamSources(data.all_sources || []);
      } else {
        setStreamError('Pixeldrain tidak tersedia untuk episode ini. Coba episode lain.');
      }
    } catch (e) {
      setStreamError('Gagal memuat stream: ' + e.message);
    }
    setStreamLoading(false);
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

  const episodes = anime.episodes || [];
  const totalPages = Math.ceil(episodes.length / EP_PER_PAGE);
  const displayEps = episodes.slice(epPage * EP_PER_PAGE, (epPage + 1) * EP_PER_PAGE);

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
              style={{ boxShadow:'0 0 40px rgba(0,194,255,0.15)' }}>
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
              ['SEASON',   anime.season],
              ['STUDIO',   anime.studio],
              ['RILIS',    anime.released],
              ['TOTAL EP', anime.totalEpisodes],
            ].filter(([,v]) => v).map(([label, val]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="font-mono text-xs text-slate-v w-20 shrink-0">{label}</span>
                <span className="text-xs text-ice/80">{val}</span>
              </div>
            ))}
            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {anime.genres.map((g,i) => <span key={i} className="cyber-tag">{g}</span>)}
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
              <p className="text-sm text-ice/70 leading-relaxed">{anime.synopsis}</p>
            </div>
          )}

          {/* ===== PLAYER ===== */}
          <div ref={playerRef} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
              <h2 className="font-orbitron font-bold text-sm tracking-wider">
                {selectedEp ? `EPISODE ${selectedEp.number}` : 'VIDEO PLAYER'}
              </h2>
              {streamLoading && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-cyan-neon border-t-transparent rounded-full animate-spin"/>
                  <span className="font-mono text-xs text-slate-v">EXTRACTING PIXELDRAIN...</span>
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
                <button onClick={() => selectedEp && handleEpisode(selectedEp)}
                  className="cyber-tag cursor-pointer hover:text-cyan-neon">↺ RETRY</button>
              </div>
            ) : (
              <VideoPlayer
                src={streamUrl}
                title={`${anime.title}${selectedEp ? ` - Ep ${selectedEp.number}` : ''}`}
                onError={() => setStreamError('Video error. Format tidak kompatibel atau link bermasalah.')}
              />
            )}

            {/* Pilih kualitas */}
            {streamSources.length > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-slate-v">KUALITAS:</span>
                {streamSources.map((s, i) => (
                  <button key={i} onClick={() => setStreamUrl(s.url)}
                    className={`ep-btn rounded px-3 py-1 transition-all ${s.url === streamUrl ? 'active' : ''}`}>
                    {s.quality || `Src ${i+1}`}
                  </button>
                ))}
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
                          epPage===i ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                            : 'border-slate-v text-slate-v hover:border-cyan-neon/50'}`}>
                        {i*EP_PER_PAGE+1}–{Math.min((i+1)*EP_PER_PAGE, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {displayEps.map((ep, i) => (
                  <button key={i} onClick={() => handleEpisode(ep)} title={ep.date || ep.title}
                    className={`ep-btn rounded py-2 text-center transition-all ${selectedEp?.url===ep.url ? 'active' : ''}`}>
                    {ep.number || (epPage*EP_PER_PAGE+i+1)}
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
        </div>
      </div>
    </div>
  );
}
