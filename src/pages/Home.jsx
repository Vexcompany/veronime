import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimeRow from '../components/AnimeRow';
import { fetchHomeData, fetchAnimeList } from '../utils/api';

function HeroSection({ anime }) {
  const navigate = useNavigate();
  if (!anime) return null;

  return (
    <div className="relative min-h-[75vh] flex items-end overflow-hidden mb-16">
      {/* BG layer */}
      <div className="absolute inset-0">
        {anime.image && (
          <img
            src={anime.image} alt=""
            className="w-full h-full object-cover object-top blur-sm scale-110 opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/90 to-abyss/30"/>
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/50 to-transparent"/>
        <div className="absolute inset-0 aurora-bg opacity-50"/>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(0,194,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}/>
        {/* Scanlines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
          pointerEvents: 'none',
        }}/>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-14 flex gap-8 items-end w-full">
        {/* Floating poster */}
        <div className="hidden md:block shrink-0 animate-float">
          <div
            className="w-44 rounded overflow-hidden holo-shimmer scanline-overlay"
            style={{
              border: '1px solid rgba(0,194,255,0.4)',
              boxShadow: '0 0 50px rgba(0,194,255,0.25), 0 25px 70px rgba(0,0,0,0.7)',
            }}
          >
            <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover"/>
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="cyber-tag">FEATURED</span>
            <span className="font-mono text-xs text-slate-v">#1 THIS WEEK</span>
          </div>

          <h1 className="font-orbitron font-black text-2xl md:text-4xl lg:text-[2.8rem] text-ice mb-3 leading-tight glow-cyan">
            {anime.title}
          </h1>

          {anime.episode && (
            <p className="font-mono text-xs text-cyan-neon mb-4 tracking-wider">
              ▸ {anime.episode} AVAILABLE
            </p>
          )}

          <button
            onClick={() => navigate(`/anime/${anime.slug}`)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded font-orbitron text-xs font-bold tracking-widest text-abyss transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #00C2FF, #7B2FFF)',
              boxShadow: '0 0 30px rgba(0,194,255,0.4)',
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            WATCH NOW
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon/40 to-transparent"/>
    </div>
  );
}

export default function Home() {
  const [terbaru, setTerbaru] = useState([]);
  const [popular, setPopular] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    // Primary: ambil home-data + popular + movie sekaligus
    Promise.all([
      fetchHomeData(),
      fetchAnimeList('popular', 1),
      fetchAnimeList('movie', 1),
    ])
      .then(([homeData, popData, movieData]) => {
        // home-data: terbaru dari homepage Samehadaku
        const tb = homeData.terbaru || [];
        const top10 = homeData.top10 || [];

        // Gabung: prioritas terbaru, fallback top10
        setTerbaru(tb.length ? tb : top10);
        setPopular(popData.results || top10);
        setMovies(movieData.results || []);
      })
      .catch(e => {
        console.error(e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"/>
        <p className="font-mono text-xs text-slate-v tracking-widest animate-pulse">LOADING VERONIME...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center border-glow rounded p-8 max-w-md">
        <p className="font-orbitron text-red-400 mb-2">FAILED TO LOAD</p>
        <p className="text-slate-v text-sm mb-4 font-mono">{error}</p>
        <p className="font-mono text-xs text-slate-v/60">
          Pastikan sudah deploy ke Vercel dan jalankan dengan <code className="text-cyan-neon">vercel dev</code> saat development.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 cyber-tag cursor-pointer hover:text-cyan-neon block mx-auto"
        >
          RETRY
        </button>
      </div>
    </div>
  );

  const heroAnime = terbaru[0] || popular[0] || null;

  return (
    <div>
      <HeroSection anime={heroAnime}/>
      <AnimeRow title="ANIME TERBARU" tag="LIVE" items={terbaru} viewAllLink="/ongoing"/>
      <AnimeRow title="POPULER MINGGU INI" tag="HOT" items={popular} viewAllLink="/popular"/>
      <AnimeRow title="MOVIES" items={movies} viewAllLink="/movies"/>

      {!terbaru.length && !popular.length && !movies.length && (
        <div className="text-center py-20 px-4">
          <p className="font-orbitron text-slate-v text-sm mb-2">DATA KOSONG</p>
          <p className="font-mono text-xs text-slate-v/50 max-w-sm mx-auto">
            API berhasil tapi tidak ada hasil. Periksa console Vercel untuk debug info.
          </p>
        </div>
      )}
    </div>
  );
}
