import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchAnimeList } from '../utils/api';

const TYPE_MAP = {
  '/ongoing': { type: 'ongoing', label: 'ONGOING', tag: 'LIVE' },
  '/popular': { type: 'popular', label: 'POPULAR', tag: 'HOT' },
  '/movies': { type: 'movie', label: 'MOVIES', tag: null },
};

export default function BrowsePage() {
  const location = useLocation();
  const config = TYPE_MAP[location.pathname] || { type: 'ongoing', label: 'ONGOING', tag: 'LIVE' };
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setItems([]); setPage(1); setHasMore(true);
  }, [location.pathname]);

  useEffect(() => {
    setLoading(true);
    fetchAnimeList(config.type, page)
      .then(data => {
        const results = data.results || [];
        setItems(prev => page === 1 ? results : [...prev, ...results]);
        setHasMore(results.length > 0 && data.hasNextPage !== false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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
      </div>

      {/* Grid */}
      <div className="neo-grid">
        {items.map((anime, i) => (
          <AnimeCard key={i} anime={anime}/>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center mt-12">
          <div className="spinner"/>
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && items.length > 0 && (
        <div className="flex justify-center mt-10">
          <button onClick={() => setPage(p => p + 1)}
            className="font-orbitron text-xs font-bold tracking-widest px-8 py-3 border border-cyan-neon/50 text-cyan-neon hover:bg-cyan-neon/10 transition-colors rounded"
            style={{ boxShadow: '0 0 20px rgba(0,194,255,0.1)' }}>
            LOAD MORE
          </button>
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">NO DATA FOUND</p>
        </div>
      )}
    </div>
  );
}
