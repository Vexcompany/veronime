import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchAnimeList } from '../utils/api';

const TYPE_MAP = {
  '/ongoing': { type: 'ongoing', label: 'ANIME TERBARU', tag: 'LIVE' },
  '/popular': { type: 'popular', label: 'POPULER', tag: 'HOT' },
  '/movies': { type: 'movie', label: 'MOVIES', tag: null },
};

export default function BrowsePage() {
  const location = useLocation();
  const config = TYPE_MAP[location.pathname] || { type: 'ongoing', label: 'ANIME TERBARU', tag: 'LIVE' };
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const initialized = useRef(false);

  // Reset saat pindah halaman
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    initialized.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (loading) return;
    setLoading(true);
    setError(null);
    fetchAnimeList(config.type, page)
      .then(data => {
        const results = data.results || [];
        setItems(prev => page === 1 ? results : [...prev, ...results]);
        setHasMore(results.length >= 10 && data.hasNextPage !== false);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, config.type]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-2xl text-ice tracking-wider">{config.label}</h1>
          {config.tag && <span className="cyber-tag mt-1 inline-block">{config.tag}</span>}
        </div>
        <span className="font-mono text-xs text-slate-v ml-auto">{items.length} hasil</span>
      </div>

      {/* Error state */}
      {error && (
        <div className="border border-red-900/40 rounded p-6 text-center mb-8">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="neo-grid">
          {items.map((anime, i) => (
            <AnimeCard key={`${anime.slug}-${i}`} anime={anime}/>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center mt-12">
          <div className="spinner"/>
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && items.length > 0 && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setPage(p => p + 1)}
            className="font-orbitron text-xs font-bold tracking-widest px-8 py-3 border border-cyan-neon/50 text-cyan-neon hover:bg-cyan-neon/10 transition-all rounded"
            style={{ boxShadow: '0 0 20px rgba(0,194,255,0.1)' }}>
            LOAD MORE
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA DATA</p>
          <p className="font-mono text-xs text-slate-v/50 mt-2">Coba refresh atau periksa koneksi.</p>
        </div>
      )}
    </div>
  );
}
