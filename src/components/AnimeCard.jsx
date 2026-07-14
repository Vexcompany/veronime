import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Cache poster in-memory agar tidak re-fetch tiap render
const posterCache = {};

export default function AnimeCard({ anime }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();
  const [tiltStyle, setTiltStyle] = useState({});
  const [hovered, setHovered] = useState(false);

  // Poster: dari prop dulu (jika sudah benar/dari detail API), 
  // atau fetch via /api/poster jika gambar terlihat seperti thumbnail episode
  const [poster, setPoster] = useState(anime.image || '');
  const [posterLoaded, setPosterLoaded] = useState(false);

  useEffect(() => {
    if (!anime.slug) return;

    // Cek apakah gambar yang ada adalah thumbnail episode (bukan poster)
    // Indikator: URL mengandung "-Episode-" atau "-episode-" atau "-ep-"
    const isEpisodeThumb = anime.image && (
      /-episode-/i.test(anime.image) ||
      /-ep-\d/i.test(anime.image) ||
      /Episode-\d/i.test(anime.image)
    );

    // Jika sudah ada di cache, langsung pakai
    if (posterCache[anime.slug]) {
      setPoster(posterCache[anime.slug]);
      return;
    }

    // Jika gambar terdeteksi sebagai thumbnail episode, fetch poster asli
    if (isEpisodeThumb || !anime.image) {
      fetch(`/api/poster?slug=${encodeURIComponent(anime.slug)}`)
        .then(r => r.json())
        .then(d => {
          if (d.image) {
            posterCache[anime.slug] = d.image;
            setPoster(d.image);
          }
        })
        .catch(() => {}); // silent fail — tetap pakai gambar awal
    }
  }, [anime.slug, anime.image]);

  // 3D tilt on hover
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
    setTiltStyle({ transform: 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)', transition: 'transform 0.5s ease' });
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/anime/${anime.slug}`)}
      style={{ ...tiltStyle, transformStyle: 'preserve-3d', cursor: 'pointer' }}
      className="relative group select-none"
    >
      <div className="relative rounded overflow-hidden border border-slate-v group-hover:border-cyan-neon/50 transition-colors duration-300 holo-shimmer scanline-overlay">
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden bg-navy">
          {/* Placeholder shimmer saat loading */}
          {!posterLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-abyss animate-pulse"/>
          )}
          <img
            src={poster || `https://placehold.co/200x300/0D1B2E/3A4A5C?text=${encodeURIComponent(anime.title?.slice(0,10) || '?')}`}
            alt={anime.title}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${posterLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setPosterLoaded(true)}
            onError={() => setPosterLoaded(true)} // jangan stuck di loading state
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>

          {/* Episode badge */}
          {anime.episode && (
            <div className="absolute top-2 right-2">
              <span className="font-mono text-xs bg-abyss/90 border border-cyan-neon/40 text-cyan-neon px-2 py-0.5 rounded-sm">
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

          {/* Bottom glow line */}
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}/>
        </div>

        {/* Title bar */}
        <div className="p-2 bg-navy/90">
          <p className="text-xs text-ice font-medium line-clamp-2 leading-tight">{anime.title}</p>
          {anime.released && (
            <p className="text-xs text-slate-v font-mono mt-0.5 truncate">{anime.released}</p>
          )}
        </div>
      </div>

      {/* Glow effect */}
      {hovered && (
        <div className="absolute inset-0 rounded pointer-events-none"
             style={{ boxShadow: '0 0 25px rgba(0,194,255,0.15), 0 0 50px rgba(123,47,255,0.08)' }}/>
      )}
    </div>
  );
}
