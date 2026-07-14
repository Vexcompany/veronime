import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSearch } from '../utils/api';

const NAV_LINKS = [
  ['/', 'HOME'],
  ['/ongoing', 'TERBARU'],
  ['/schedule', 'JADWAL'],
];

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchSearch(query);
        setResults(data.results || []);
        setOpen(true);
      } catch { setResults([]); }
      setSearching(false);
    }, 450);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (slug) => {
    setOpen(false); setQuery('');
    navigate(`/anime/${slug}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="nav-glass fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-neon to-violet-elec rounded-sm opacity-90"
              style={{ clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }}/>
            <span className="absolute inset-0 flex items-center justify-center text-white font-orbitron font-black text-xs">V</span>
          </div>
          <span className="font-orbitron font-bold text-lg tracking-widest gradient-text hidden sm:block">VERONIME</span>
        </Link>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(([to, label]) => (
            <Link key={to} to={to}
              className="font-mono text-xs tracking-widest text-slate-v hover:text-cyan-neon transition-colors relative group">
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-neon transition-all group-hover:w-full"/>
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs" ref={searchRef}>
          <div className="flex items-center gap-2 bg-navy border border-slate-v rounded px-3 py-1.5 focus-within:border-cyan-neon transition-colors">
            <svg className="w-3.5 h-3.5 text-slate-v shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              className="bg-transparent text-xs text-ice outline-none w-full placeholder-slate-v font-mono"
              placeholder="SEARCH ANIME..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
            {searching && <div className="w-3 h-3 border border-cyan-neon border-t-transparent rounded-full animate-spin shrink-0"/>}
          </div>

          {/* Dropdown autocomplete */}
          {open && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-navy border border-slate-v/60 rounded overflow-hidden z-50 shadow-2xl">
              {results.slice(0, 6).map((r, i) => (
                <button key={i} onClick={() => handleSelect(r.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-cyan-neon/10 transition-colors text-left">
                  {r.image && (
                    <img src={r.image} alt="" className="w-8 h-10 object-cover rounded-sm shrink-0 border border-slate-v/30"/>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-ice font-medium line-clamp-1">{r.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.status && <p className="text-xs text-slate-v font-mono">{r.status}</p>}
                      {r.score && <p className="text-xs text-cyan-neon/70 font-mono">★ {r.score}</p>}
                    </div>
                  </div>
                </button>
              ))}
              {/* Lihat semua */}
              <button
                onClick={() => { setOpen(false); navigate(`/search?q=${encodeURIComponent(query)}`); }}
                className="w-full px-3 py-2 text-center font-mono text-xs text-slate-v hover:text-cyan-neon border-t border-slate-v/30 transition-colors">
                LIHAT SEMUA HASIL →
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-slate-v hover:text-cyan-neon transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-slate-v/40 px-4 py-3 flex flex-col gap-3">
          {NAV_LINKS.map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="font-mono text-xs tracking-widest text-slate-v hover:text-cyan-neon transition-colors">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
