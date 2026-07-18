import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proxied, externalUrl } from '../utils/api';

const CATEGORY_STYLE = {
  manga: { label: 'MANGA', cls: 'text-pink-300 border-pink-400/40' },
  novel: { label: 'NOVEL', cls: 'text-amber-300 border-amber-400/40' },
  anime: { label: null,    cls: '' },
};

export default function AnimeCard({ anime }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const [tiltStyle, setTiltStyle] = useState({});
  const [hovered, setHovered] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const isExternal = anime.external || (anime.category && anime.category !== 'anime');
  const cat = CATEGORY_STYLE[anime.category] || CATEGORY_STYLE.anime;

  const handleClick = () => {
    if (isExternal) {
      // Konten non-anime (manga/novel) belum punya halaman internal — buka sumbernya
      window.open(externalUrl(anime), '_blank', 'noopener');
    } else if (anime.slug) {
      navigate(`/anime/${anime.slug}`);
    }
  };

  // 3D tilt
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({
      transform: `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.04)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)',
      transition: 'transform 0.5s ease',
    });
    setHovered(false);
  };

  const posterSrc = anime.image
    ? useProxy ? proxied(anime.image) : anime.image
    : 'https://placehold.co/200x300/0D1B2E/3A4A5C?text=...';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ ...tiltStyle, transformStyle: 'preserve-3d', cursor: 'pointer' }}
      className="relative group select-none"
    >
      <div className="relative rounded overflow-hidden border border-slate-v group-hover:border-cyan-neon/50 transition-colors duration-300 holo-shimmer scanline-overlay">
        <div className="aspect-[2/3] relative overflow-hidden bg-navy">
          {!posterLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-abyss animate-pulse"/>
          )}
          <img
            src={posterSrc}
            alt={anime.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setPosterLoaded(true)}
            onError={() => {
              if (!useProxy && anime.image) { setUseProxy(true); setPosterLoaded(false); }
              else setPosterLoaded(true);
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

          {anime.episode && (
            <div className="absolute top-2 right-2">
              <span className="font-mono text-xs bg-abyss/90 border border-cyan-neon/40 text-cyan-neon px-2 py-0.5 rounded-sm">
                {anime.episode}
              </span>
            </div>
          )}

          {cat.label && (
            <div className="absolute top-2 left-2">
              <span className={`font-mono text-xs bg-abyss/90 border px-2 py-0.5 rounded-sm ${cat.cls}`}>
                {cat.label}
              </span>
            </div>
          )}

          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-12 h-12 rounded-full border-2 border-cyan-neon flex items-center justify-center bg-abyss/60 backdrop-blur-sm"
                 style={{ boxShadow: '0 0 20px rgba(0,194,255,0.5)' }}>
              {isExternal ? (
                <svg className="w-5 h-5 text-cyan-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-cyan-neon ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}/>
        </div>

        <div className="p-2 bg-navy/90">
          <p className="text-xs text-ice font-medium line-clamp-2 leading-tight">{anime.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {anime.type && <p className="text-xs text-slate-v font-mono truncate">{anime.type}</p>}
            {anime.score != null && <p className="text-xs text-cyan-neon/70 font-mono">★ {anime.score}</p>}
            {anime.status && <p className="text-xs text-slate-v/60 font-mono truncate ml-auto">{anime.status}</p>}
          </div>
        </div>
      </div>

      {hovered && (
        <div className="absolute inset-0 rounded pointer-events-none"
             style={{ boxShadow: '0 0 25px rgba(0,194,255,0.15), 0 0 50px rgba(123,47,255,0.08)' }}/>
      )}
    </div>
  );
}
