import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { fetchAnimeDetail, fetchStream } from '../utils/api';

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
  const [epPage, setEpPage] = useState(0);
  const playerRef = useRef(null);
  const EP_PER_PAGE = 50;

  useEffect(() => {
    setLoading(true); setError(null);
    fetchAnimeDetail(slug)
      .then(data => setAnime(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEpisode = async (ep) => {
    setSelectedEp(ep);
    setStreamLoading(true);
    setStreamError('');
    setStreamUrl('');
    // Scroll to player on mobile
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const data = await fetchStream(ep.url);
      if (data.player_src) setStreamUrl(data.player_src);
      else setStreamError('Stream tidak tersedia untuk episode ini.');
    } catch (e) {
      setStreamError('Gagal memuat stream: ' + e.message);
    }
    setStreamLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"/>
        <p className="font-mono text-xs text-slate-v tracking-widest">LOADING ANIME DATA...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="font-orbitron text-cyan-neon mb-2">ERROR</p>
        <p className="text-slate-v text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 cyber-tag cursor-pointer hover:text-cyan-neon">← BACK</button>
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
        <span className="text-ice line-clamp-1">{anime.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Left: Poster + Info */}
        <div className="lg:sticky lg:top-24 self-start">
          {/* Poster */}
          <div className="holo-shimmer scanline-overlay rounded overflow-hidden border-glow mb-6 animate-float"
               style={{ boxShadow: '0 0 40px rgba(0,194,255,0.15)' }}>
            <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover"/>
          </div>

          {/* Meta info */}
          <div className="space-y-3">
            {[
              ['STATUS', anime.status],
              ['TYPE', anime.type],
              ['EPISODES', anime.totalEpisodes || episodes.length],
              ['SEASON', anime.season],
              ['STUDIO', anime.studio],
              ['SCORE', anime.score],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="font-mono text-xs text-slate-v w-20 shrink-0">{label}</span>
                <span className="text-xs text-ice">{val}</span>
              </div>
            ))}

            {/* Genres */}
            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {anime.genres.map((g, i) => (
                  <span key={i} className="cyber-tag text-xs">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Player + Episodes */}
        <div>
          {/* Title */}
          <h1 className="font-orbitron font-black text-xl md:text-3xl text-ice mb-2 leading-tight glow-cyan">
            {anime.title}
          </h1>
          {anime.titleJp && <p className="font-mono text-xs text-slate-v mb-4">{anime.titleJp}</p>}

          {/* Synopsis */}
          {anime.synopsis && (
            <div className="mb-6 p-4 bg-navy rounded border border-slate-v/30">
              <p className="font-mono text-xs text-slate-v mb-2 tracking-wider">SYNOPSIS</p>
              <p className="text-sm text-ice/70 leading-relaxed">{anime.synopsis}</p>
            </div>
          )}

          {/* Player */}
          <div ref={playerRef} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
              <h2 className="font-orbitron font-bold text-sm tracking-wider">
                {selectedEp ? `EP ${selectedEp.number || selectedEp.title}` : 'SELECT EPISODE'}
              </h2>
              {streamLoading && <div className="w-3 h-3 border border-cyan-neon border-t-transparent rounded-full animate-spin"/>}
            </div>

            {streamLoading ? (
              <div className="w-full aspect-video bg-abyss border border-slate-v rounded flex flex-col items-center justify-center gap-3">
                <div className="spinner"/>
                <p className="font-mono text-xs text-slate-v">EXTRACTING STREAM...</p>
              </div>
            ) : streamError ? (
              <div className="w-full aspect-video bg-abyss border border-red-900/50 rounded flex flex-col items-center justify-center gap-3">
                <svg className="w-10 h-10 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <p className="font-mono text-xs text-red-400">{streamError}</p>
              </div>
            ) : (
              <VideoPlayer
                src={streamUrl}
                title={`${anime.title} - ${selectedEp ? 'Episode ' + (selectedEp.number || selectedEp.title) : ''}`}
                onError={() => setStreamError('Video error. Mungkin stream tidak kompatibel.')}
              />
            )}
          </div>

          {/* Episode list */}
          {episodes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
                  <h2 className="font-orbitron font-bold text-sm tracking-wider">EPISODES</h2>
                  <span className="font-mono text-xs text-slate-v">{episodes.length} EPS</span>
                </div>

                {/* Pagination buttons */}
                {totalPages > 1 && (
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setEpPage(i)}
                        className={`font-mono text-xs px-2 py-1 border rounded transition-colors ${
                          epPage === i ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10' : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
                        }`}>
                        {i * EP_PER_PAGE + 1}-{Math.min((i + 1) * EP_PER_PAGE, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {displayEps.map((ep, i) => (
                  <button key={i} onClick={() => handleEpisode(ep)}
                    className={`ep-btn rounded px-2 py-2 text-center transition-all ${
                      selectedEp?.url === ep.url ? 'active' : ''
                    }`}>
                    {ep.number || ep.title || (i + 1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
