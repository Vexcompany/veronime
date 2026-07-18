import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchSearch } from '../utils/api';

const TABS = [
  ['all', 'SEMUA'],
  ['anime', 'ANIME'],
  ['manga', 'MANGA'],
  ['novel', 'NOVEL'],
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState({});
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) return;
    setTab('all');
    setLoading(true); setError(null);
    fetchSearch(q)
      .then(d => {
        setResults(d.results || []);
        setCounts(d.counts || {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [q]);

  const filtered = tab === 'all' ? results : results.filter((r) => (r.category || 'anime') === tab);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-xl text-ice tracking-wider">HASIL PENCARIAN</h1>
          <p className="font-mono text-xs text-slate-v mt-1">
            "{q}" — {results.length} hasil
            {(counts.manga || counts.novel) ? ' (anime, manga & novel)' : ''}
          </p>
        </div>
      </div>

      {/* Tab kategori */}
      {results.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.filter(([k]) => k === 'all' || counts[k]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`font-mono text-xs px-4 py-1.5 rounded border transition-colors ${
                tab === k
                  ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                  : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
              }`}>
              {label}{k !== 'all' ? ` (${counts[k] || 0})` : ''}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="border border-red-900/40 rounded p-4 mb-6 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-20"><div className="spinner"/></div>
      ) : filtered.length > 0 ? (
        <>
          <div className="neo-grid">
            {filtered.map((a, i) => <AnimeCard key={`${a.category}-${a.slug}-${i}`} anime={a}/>)}
          </div>
          {tab !== 'anime' && filtered.some((r) => r.category !== 'anime') && (
            <p className="font-mono text-xs text-slate-v/50 mt-6 text-center">
              * Hasil manga &amp; novel dibuka di situs sumber (anibiplay.net)
            </p>
          )}
        </>
      ) : q && !loading ? (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA HASIL UNTUK "{q}"</p>
        </div>
      ) : null}
    </div>
  );
}
