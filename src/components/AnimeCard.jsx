import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnimeCard({ anime }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const [style, setStyle] = useState({});
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.04)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)', transition: 'transform 0.5s ease' });
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/anime/${anime.slug}`)}
      style={{ ...style, transformStyle: 'preserve-3d', cursor: 'pointer' }}
      className="relative group select-none"
    >
      {/* Card */}
      <div className="relative rounded overflow-hidden border border-slate-v group-hover:border-cyan-neon/50 transition-colors duration-300 holo-shimmer scanline-overlay">
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden">
          <img
            src={anime.image || 'https://via.placeholder.com/200x300/0D1B2E/00C2FF?text=N/A'}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
          
          {/* Status badge */}
          {anime.status && (
            <div className="absolute top-2 left-2">
              <span className={`cyber-tag text-xs px-2 py-0.5 ${
                anime.status?.toLowerCase().includes('ongoing') ? 'border-cyan-neon text-cyan-neon' : 'border-violet-elec text-violet-elec'
              }`}>
                {anime.status}
              </span>
            </div>
          )}

          {/* Episode badge */}
          {anime.episode && (
            <div className="absolute top-2 right-2">
              <span className="font-mono text-xs bg-abyss/80 border border-slate-v px-2 py-0.5 rounded-sm text-slate-v">
                {anime.episode}
              </span>
            </div>
          )}

          {/* Play button on hover */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-12 h-12 rounded-full border-2 border-cyan-neon flex items-center justify-center bg-abyss/60 backdrop-blur-sm"
                 style={{ boxShadow: '0 0 20px rgba(0,194,255,0.5)' }}>
              <svg className="w-5 h-5 text-cyan-neon ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* Cyan glow line bottom */}
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}/>
        </div>

        {/* Info */}
        <div className="p-2 bg-navy/90 backdrop-blur-sm">
          <p className="text-xs text-ice font-medium line-clamp-2 leading-tight">{anime.title}</p>
          {anime.type && (
            <p className="text-xs text-slate-v font-mono mt-1">{anime.type}</p>
          )}
        </div>
      </div>

      {/* Holographic glow */}
      {hovered && (
        <div className="absolute inset-0 rounded pointer-events-none"
             style={{ boxShadow: '0 0 25px rgba(0,194,255,0.15), 0 0 50px rgba(123,47,255,0.08)' }}/>
      )}
    </div>
  );
}
