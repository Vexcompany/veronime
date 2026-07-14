import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSchedule } from '../utils/api';

const DAYS = [
  { en: 'monday',    id: 'SENIN' },
  { en: 'tuesday',   id: 'SELASA' },
  { en: 'wednesday', id: 'RABU' },
  { en: 'thursday',  id: 'KAMIS' },
  { en: 'friday',    id: 'JUMAT' },
  { en: 'saturday',  id: 'SABTU' },
  { en: 'sunday',    id: 'MINGGU' },
];

function getTodayEn() {
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
}

const PERPAGE_OPTIONS = [0, 5, 10, 20];

export default function SchedulePage() {
  const navigate = useNavigate();
  const today = getTodayEn();
  const [activeDay, setActiveDay] = useState(today);
  const [perpage, setPerpage]   = useState(0); // 0 = tampilkan semua
  const [data, setData]         = useState({});  // cache per hari
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Fetch saat hari / perpage berubah
  useEffect(() => {
    const cacheKey = `${activeDay}_${perpage}`;
    if (data[cacheKey]) return; // sudah di-cache

    setLoading(true); setError(null);
    fetchSchedule(activeDay, perpage)
      .then(res => {
        setData(prev => ({ ...prev, [cacheKey]: res.anime_list || [] }));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeDay, perpage]);

  const cacheKey = `${activeDay}_${perpage}`;
  const list = data[cacheKey] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
        <h1 className="font-orbitron font-black text-2xl text-ice tracking-wider">JADWAL RILIS</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-8">
        {/* Hari */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map(d => (
            <button key={d.en} onClick={() => setActiveDay(d.en)}
              className={`font-mono text-xs px-3 py-2 border rounded transition-all ${
                activeDay === d.en
                  ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                  : 'border-slate-v text-slate-v hover:border-cyan-neon/50 hover:text-cyan-neon/70'
              } ${d.en === today ? 'ring-1 ring-violet-elec/60' : ''}`}>
              {d.id}
              {d.en === today && (
                <span className="ml-1 text-violet-elec">•</span>
              )}
            </button>
          ))}
        </div>

        {/* Jumlah tampil */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="font-mono text-xs text-slate-v">TAMPILKAN:</span>
          {PERPAGE_OPTIONS.map(n => (
            <button key={n} onClick={() => setPerpage(n)}
              className={`font-mono text-xs px-2.5 py-1.5 border rounded transition-all ${
                perpage === n
                  ? 'border-cyan-neon text-cyan-neon bg-cyan-neon/10'
                  : 'border-slate-v text-slate-v hover:border-cyan-neon/50'
              }`}>
              {n === 0 ? 'SEMUA' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Info hari aktif */}
      <div className="flex items-center gap-3 mb-6">
        <span className="cyber-tag">
          {DAYS.find(d => d.en === activeDay)?.id}
        </span>
        {!loading && (
          <span className="font-mono text-xs text-slate-v">{list.length} anime</span>
        )}
        {activeDay === today && (
          <span className="font-mono text-xs text-violet-elec">← HARI INI</span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20"><div className="spinner"/></div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-900/40 rounded p-4 text-center">
          <p className="font-mono text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Grid jadwal */}
      {!loading && !error && list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((anime, i) => (
            <button key={i}
              onClick={() => navigate(`/anime/${anime.slug}`)}
              className="border-glow rounded p-4 text-left hover:bg-cyan-neon/5 transition-all group holo-shimmer">
              <div className="flex gap-4">
                {/* Poster kecil */}
                {anime.image && (
                  <img src={anime.image} alt={anime.title}
                    className="w-14 h-20 object-cover rounded shrink-0 border border-slate-v/40"/>
                )}
                <div className="flex-1 min-w-0">
                  {/* Waktu */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-cyan-neon font-bold">{anime.time || '??:??'}</span>
                    <span className="font-mono text-xs text-slate-v">{anime.type}</span>
                  </div>
                  {/* Judul */}
                  <p className="text-sm text-ice font-medium line-clamp-2 leading-tight mb-2 group-hover:text-cyan-neon transition-colors">
                    {anime.title}
                  </p>
                  {/* Genre */}
                  {anime.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {anime.genres.slice(0,3).map((g,j) => (
                        <span key={j} className="font-mono text-xs text-slate-v/70 border border-slate-v/30 px-1.5 py-0.5 rounded-sm">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Score */}
                  {anime.score && anime.score !== '0' && (
                    <p className="font-mono text-xs text-slate-v mt-2">★ {anime.score}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="text-center py-20">
          <p className="font-orbitron text-slate-v text-sm">TIDAK ADA JADWAL</p>
          <p className="font-mono text-xs text-slate-v/50 mt-1">Untuk hari ini</p>
        </div>
      )}
    </div>
  );
}
