import { useState, useEffect } from 'react';
import AnimeRow from '../components/AnimeRow';
import AnimeCard from '../components/AnimeCard';
import { fetchAnimeList } from '../utils/api';

function HeroSection({ anime }) {
  if (!anime) return null;
  return (
    <div className="relative min-h-[70vh] flex items-end overflow-hidden mb-16">
      {/* BG image */}
      <div className="absolute inset-0">
        <img src={anime.image} alt="" className="w-full h-full object-cover object-top blur-sm scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/80 to-abyss/30"/>
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-abyss/60"/>
        {/* Scanline overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 6px)',
        }}/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-12 flex gap-8 items-end w-full">
        {/* Poster */}
        <div className="hidden md:block shrink-0 animate-float">
          <div className="w-40 border-glow rounded overflow-hidden holo-shimmer scanline-overlay"
               style={{ boxShadow: '0 0 40px rgba(0,194,255,0.2), 0 20px 60px rgba(0,0,0,0.6)' }}>
            <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover"/>
          </div>
        </div>

        <div className="flex-1">
          {/* Label */}
          <div className="flex items-center gap-3 mb-3">
            <span className="cyber-tag">FEATURED</span>
            {anime.type && <span className="cyber-tag border-violet-elec text-violet-elec">{anime.type}</span>}
          </div>

          {/* Title */}
          <h1 className="font-orbitron font-black text-2xl md:text-4xl lg:text-5xl text-ice mb-3 leading-tight glow-cyan">
            {anime.title}
          </h1>

          {/* Genres */}
          {anime.genres && (
            <div className="flex flex-wrap gap-2 mb-4">
              {anime.genres.slice(0, 5).map((g, i) => (
                <span key={i} className="text-xs font-mono text-slate-v border border-slate-v/50 px-2 py-0.5 rounded-sm">{g}</span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <p className="text-sm text-ice/70 max-w-xl line-clamp-3 leading-relaxed mb-5">{anime.synopsis}</p>
          )}

          {/* CTA */}
          <a href={`/anime/${anime.slug}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-orbitron text-xs font-bold tracking-widest text-abyss transition-all"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #7B2FFF)', boxShadow: '0 0 30px rgba(0,194,255,0.4)' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            WATCH NOW
          </a>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon/40 to-transparent"/>
    </div>
  );
}

export default function Home() {
  const [ongoing, setOngoing] = useState([]);
  const [popular, setPopular] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnimeList('ongoing', 1),
      fetchAnimeList('popular', 1),
      fetchAnimeList('movie', 1),
    ]).then(([a, b, c]) => {
      setOngoing(a.results || []);
      setPopular(b.results || []);
      setMovies(c.results || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"/>
        <p className="font-mono text-xs text-slate-v tracking-widest">INITIALIZING...</p>
      </div>
    </div>
  );

  return (
    <div>
      <HeroSection anime={ongoing[0] || popular[0]}/>
      <AnimeRow title="ONGOING" tag="LIVE" items={ongoing} viewAllLink="/ongoing"/>
      <AnimeRow title="POPULAR" tag="HOT" items={popular} viewAllLink="/popular"/>
      <AnimeRow title="MOVIES" items={movies} viewAllLink="/movies"/>
    </div>
  );
}
