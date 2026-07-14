import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchTerbaru } from '../utils/api';

export default function BrowsePage() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset saat pindah tab
  useEffect(() => {
    setItems([]); setPage(1); setError(null);
  }, [location.pathname]);

  useEffect(() => {
    setLoading(true);
    fetchTerbaru(page)
      .then(data => {
        const results = data.results || [];
        setItems(prev => page === 1 ? results : [...prev, ...results]);
        setTotalPages(data.total_pages || 1);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-2xl text-ice tracking-wider">ANIME TERBARU</h1>
          <span className="cyber-tag mt-1 inline-block">LIVE</span>
        </div>
        <span className="font-mono text-xs text-slate-v ml-auto">
          Page {page} / {totalPages}
        </span>
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

      {!loading && page < totalPages && items.length > 0 && (
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
