import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchSearch } from '../utils/api';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true); setError(null);
    fetchSearch(q)
      .then(d => setResults(d.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-xl text-ice tracking-wider">HASIL PENCARIAN</h1>
          <p className="font-mono text-xs text-slate-v mt-1">"{q}" — {results.length} anime ditemukan</p>
        </div>
      </div>

      {error && (
        <div className="border border-red-900/40 rounded p-4 mb-6 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-20"><div className="spinner"/></div>
      ) : results.length > 0 ? (
        <div className="neo-grid">
          {results.map((a, i) => (
            <div key={i}>
              <AnimeCard anime={a}/>
              {/* Score dari search API */}
              {a.score && (
                <p className="font-mono text-xs text-slate-v text-center mt-1">★ {a.score}</p>
              )}
            </div>
          ))}
        </div>
      ) : q && !loading ? (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA HASIL UNTUK "{q}"</p>
        </div>
      ) : null}
    </div>
  );
}
