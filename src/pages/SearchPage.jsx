import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchSearch } from '../utils/api';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetchSearch(q)
      .then(d => setResults(d.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-xl text-ice tracking-wider">SEARCH RESULTS</h1>
          <p className="font-mono text-xs text-slate-v mt-1">"{q}" — {results.length} found</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center mt-20"><div className="spinner"/></div>
      ) : results.length > 0 ? (
        <div className="neo-grid">
          {results.map((a, i) => <AnimeCard key={i} anime={a}/>)}
        </div>
      ) : q ? (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">NO RESULTS FOR "{q}"</p>
        </div>
      ) : null}
    </div>
  );
}
