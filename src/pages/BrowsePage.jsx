import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchExplore } from '../utils/api';

// Mapping route -> filter explore AnibiPlay
const ROUTE_FILTERS = {
  '/ongoing':  { label: 'ANIME TERBARU',  tag: 'LIVE',     params: { sort: 'latest_update' } },
  '/popular':  { label: 'ANIME POPULER',  tag: 'HOT',      params: { sort: 'popular' } },
  '/movies':   { label: 'MOVIE',          tag: 'FILM',     params: { type: 'Movie' } },
  '/complete': { label: 'ANIME TAMAT',    tag: 'COMPLETE', params: { status: 'completed' } },
};

export default function BrowsePage() {
  const location = useLocation();
  const meta = ROUTE_FILTERS[location.pathname] || ROUTE_FILTERS['/ongoing'];
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset saat pindah tab
  useEffect(() => {
    setItems([]); setPage(1); setPagination(null); setError(null);
  }, [location.pathname]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchExplore({ page, ...meta.params })
      .then(data => {
        const results = data.results || [];
        setItems(prev => page === 1 ? results : [...prev, ...results]);
        setPagination(data.pagination || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, location.pathname]);

  const hasNext = pagination ? pagination.has_next : false;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-2xl text-ice tracking-wider">{meta.label}</h1>
          <span className="cyber-tag mt-1 inline-block">{meta.tag}</span>
        </div>
        {pagination && (
          <span className="font-mono text-xs text-slate-v ml-auto">
            Page {pagination.page}{pagination.last_page ? ` / ${pagination.last_page}` : ''}
            {pagination.total ? ` • ${pagination.total} anime` : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="border border-red-900/40 rounded p-4 mb-6 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="neo-grid">
          {items.map((anime, i) => <AnimeCard key={`${anime.slug}-${i}`} anime={anime}/>)}
        </div>
      )}

      {loading && (
        <div className="flex justify-center mt-12"><div className="spinner"/></div>
      )}

      {!loading && hasNext && items.length > 0 && (
        <div className="flex justify-center mt-10">
          <button onClick={() => setPage(p => p+1)}
            className="font-orbitron text-xs font-bold tracking-widest px-8 py-3 border border-cyan-neon/50 text-cyan-neon hover:bg-cyan-neon/10 transition-all rounded"
            style={{ boxShadow:'0 0 20px rgba(0,194,255,0.1)' }}>
            LOAD MORE
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA DATA</p>
        </div>
      )}
    </div>
  );
}
