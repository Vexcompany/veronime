import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSearch } from '../utils/api';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchSearch(query);
        setResults(data.results || []);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
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

  return (
    <nav className="nav-glass fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-neon to-violet-elec rounded-sm opacity-80" 
                 style={{clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}/>
            <span className="absolute inset-0 flex items-center justify-center text-white font-orbitron font-black text-xs">V</span>
          </div>
          <span className="font-orbitron font-bold text-lg tracking-widest gradient-text hidden sm:block">VERONIME</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {[['/', 'HOME'], ['/ongoing', 'ONGOING'], ['/popular', 'POPULAR'], ['/movies', 'MOVIES']].map(([to, label]) => (
            <Link key={to} to={to} className="font-mono text-xs tracking-widest text-slate-v hover:text-cyan-neon transition-colors relative group">
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
            />
            {loading && <div className="w-3 h-3 border border-cyan-neon border-t-transparent rounded-full animate-spin"/>}
          </div>
          {open && results.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-navy border border-slate-v rounded overflow-hidden z-50 shadow-2xl">
              {results.slice(0, 6).map((r, i) => (
                <button key={i} onClick={() => handleSelect(r.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-cyan-neon/10 transition-colors text-left">
                  {r.image && <img src={r.image} alt="" className="w-8 h-10 object-cover rounded-sm shrink-0"/>}
                  <div>
                    <p className="text-xs text-ice font-medium line-clamp-1">{r.title}</p>
                    {r.status && <p className="text-xs text-slate-v font-mono">{r.status}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <button className="md:hidden text-slate-v hover:text-cyan-neon" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-navy border-t border-slate-v px-4 py-3 flex flex-col gap-3">
          {[['/', 'HOME'], ['/ongoing', 'ONGOING'], ['/popular', 'POPULAR'], ['/movies', 'MOVIES']].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}
              className="font-mono text-xs tracking-widest text-slate-v hover:text-cyan-neon transition-colors">{label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
