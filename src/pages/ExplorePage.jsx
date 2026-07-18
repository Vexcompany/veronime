import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchExplore, fetchGenres } from '../utils/api';

const TYPE_OPTIONS = ['', 'TV', 'Movie', 'OVA', 'ONA', 'Special'];
const STATUS_OPTIONS = ['', 'ongoing', 'completed', 'upcoming'];
const SORT_OPTIONS = [
  ['', 'Ditambahkan Baru'],
  ['latest_update', 'Update Terbaru'],
  ['latest', 'Series Terbaru'],
  ['popular', 'Terpopuler'],
  ['rating', 'Rating Tertinggi'],
  ['title', 'Judul (A-Z)'],
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State filter dari URL
  const filters = {
    page: Math.max(1, parseInt(searchParams.get('page')) || 1),
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    sort: searchParams.get('sort') || '',
    search: searchParams.get('search') || '',
    genres: searchParams.get('genres') || '',
  };

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [allGenres, setAllGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showGenres, setShowGenres] = useState(false);

  // Load daftar genre sekali
  useEffect(() => {
    fetchGenres()
      .then((d) => setAllGenres(d.genres || []))
      .catch(() => {});
  }, []);

  // Fetch data tiap filter berubah
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchExplore(filters)
      .then((d) => {
        setItems(d.results || []);
        setPagination(d.pagination || null);
        if (d.genres?.length && !allGenres.length) setAllGenres(d.genres);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateParams = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    }
    // Selalu reset ke page 1 kalau filter selain page berubah
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const selectedGenres = filters.genres ? filters.genres.split(',').filter(Boolean) : [];

  const toggleGenre = (value) => {
    const val = String(value);
    const next = selectedGenres.includes(val)
      ? selectedGenres.filter((g) => g !== val)
      : [...selectedGenres, val];
    updateParams({ genres: next.join(',') });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  const resetAll = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: false });
  };

  const pageNumbers = () => {
    if (!pagination?.last_page) return [];
    const cur = pagination.page;
    const last = pagination.last_page;
    const pages = new Set([1, 2, cur - 1, cur, cur + 1, last - 1, last]);
    return [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <div>
          <h1 className="font-orbitron font-black text-2xl text-ice tracking-wider">EXPLORE</h1>
          {pagination?.total != null && (
            <p className="font-mono text-xs text-slate-v mt-1">{pagination.total} anime ditemukan</p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-navy/50 rounded border border-slate-v/30 mb-6 space-y-3">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="flex items-center gap-2 bg-abyss border border-slate-v rounded px-3 py-2 flex-1 focus-within:border-cyan-neon transition-colors">
            <svg className="w-3.5 h-3.5 text-slate-v shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              className="bg-transparent text-xs text-ice outline-none w-full placeholder-slate-v font-mono"
              placeholder="CARI JUDUL ANIME..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit"
            className="font-orbitron text-xs font-bold tracking-widest px-5 py-2 rounded text-abyss hover:scale-105 transition-transform"
            style={{ background:'linear-gradient(135deg,#00C2FF,#7B2FFF)' }}>
            CARI
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select value={filters.type} onChange={(e) => updateParams({ type: e.target.value })}
            className="bg-abyss border border-slate-v rounded px-3 py-2 text-xs text-ice font-mono outline-none focus:border-cyan-neon">
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || 'SEMUA TYPE'}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => updateParams({ status: e.target.value })}
            className="bg-abyss border border-slate-v rounded px-3 py-2 text-xs text-ice font-mono outline-none focus:border-cyan-neon">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.toUpperCase() : 'SEMUA STATUS'}</option>)}
          </select>
          <select value={filters.sort} onChange={(e) => updateParams({ sort: e.target.value })}
            className="bg-abyss border border-slate-v rounded px-3 py-2 text-xs text-ice font-mono outline-none focus:border-cyan-neon">
            {SORT_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label.toUpperCase()}</option>)}
          </select>
          <button type="button" onClick={() => setShowGenres(v => !v)}
            className={`font-mono text-xs px-3 py-2 rounded border transition-colors ${
              showGenres || selectedGenres.length
                ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
            }`}>
            GENRE {selectedGenres.length ? `(${selectedGenres.length})` : ''} {showGenres ? '▲' : '▼'}
          </button>
          {(filters.type || filters.status || filters.sort || filters.search || filters.genres) && (
            <button type="button" onClick={resetAll}
              className="font-mono text-xs px-3 py-2 rounded border border-red-900/50 text-red-400/80 hover:border-red-500 transition-colors">
              RESET ✕
            </button>
          )}
        </div>

        {/* Genre chips */}
        {showGenres && allGenres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-v/20">
            {allGenres.map((g) => {
              const active = selectedGenres.includes(g.value) || selectedGenres.includes(g.label);
              return (
                <button key={g.value} type="button" onClick={() => toggleGenre(g.value)}
                  className={`cyber-tag cursor-pointer transition-all ${active ? '!text-abyss !bg-cyan-neon !border-cyan-neon' : 'hover:text-cyan-neon'}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="border border-red-900/40 rounded p-4 mb-6 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner"/></div>
      ) : items.length > 0 ? (
        <div className="neo-grid">
          {items.map((anime, i) => <AnimeCard key={`${anime.slug}-${i}`} anime={anime}/>)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA HASIL</p>
        </div>
      )}

      {/* Pagination */}
      {pagination?.last_page > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
          <button disabled={!pagination.has_prev} onClick={() => updateParams({ page: pagination.page - 1 })}
            className="ep-btn rounded px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
            ‹ PREV
          </button>
          {pageNumbers().map((p, i, arr) => (
            <span key={p} className="flex items-center">
              {i > 0 && arr[i - 1] < p - 1 && <span className="font-mono text-xs text-slate-v px-1">…</span>}
              <button onClick={() => updateParams({ page: p })}
                className={`font-mono text-xs px-3 py-1.5 border rounded transition-colors ${
                  pagination.page === p
                    ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                    : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
                }`}>
                {p}
              </button>
            </span>
          ))}
          <button disabled={!pagination.has_next} onClick={() => updateParams({ page: pagination.page + 1 })}
            className="ep-btn rounded px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
            NEXT ›
          </button>
        </div>
      )}
    </div>
  );
}
