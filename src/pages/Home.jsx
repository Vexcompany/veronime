import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimeRow from '../components/AnimeRow';
import { fetchTerbaru, fetchSchedule } from '../utils/api';

// Hari ini untuk highlight jadwal
function getTodayEn() {
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
}

function HeroSection({ anime }) {
  const navigate = useNavigate();
  if (!anime) return null;
  return (
    <div className="relative min-h-[75vh] flex items-end overflow-hidden mb-16">
      <div className="absolute inset-0">
        {anime.image && (
          <img src={anime.image} alt=""
            className="w-full h-full object-cover object-top blur-sm scale-110 opacity-30"/>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/90 to-abyss/30"/>
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/50 to-transparent"/>
        <div className="absolute inset-0 aurora-bg opacity-50"/>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(0,194,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}/>
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
          pointerEvents: 'none',
        }}/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-14 flex gap-8 items-end w-full">
        <div className="hidden md:block shrink-0 animate-float">
          <div className="w-44 rounded overflow-hidden holo-shimmer scanline-overlay"
            style={{ border:'1px solid rgba(0,194,255,0.4)', boxShadow:'0 0 50px rgba(0,194,255,0.25),0 25px 70px rgba(0,0,0,0.7)' }}>
            <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover"/>
          </div>
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="cyber-tag">FEATURED</span>
            {anime.episode && (
              <span className="font-mono text-xs text-cyan-neon">▸ {anime.episode} AVAILABLE</span>
            )}
          </div>
          <h1 className="font-orbitron font-black text-2xl md:text-4xl lg:text-[2.8rem] text-ice mb-5 leading-tight glow-cyan">
            {anime.title}
          </h1>
          <button
            onClick={() => navigate(`/anime/${anime.slug}`)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded font-orbitron text-xs font-bold tracking-widest text-abyss transition-all hover:scale-105 active:scale-95"
            style={{ background:'linear-gradient(135deg,#00C2FF,#7B2FFF)', boxShadow:'0 0 30px rgba(0,194,255,0.4)' }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            WATCH NOW
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-neon/40 to-transparent"/>
    </div>
  );
}

// Mini jadwal hari ini di homepage
function TodaySchedule({ items, day }) {
  const navigate = useNavigate();
  if (!items.length) return null;
  return (
    <section className="mb-12 px-4 md:px-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
          <h2 className="font-orbitron font-bold text-base text-ice tracking-wider">JADWAL HARI INI</h2>
          <span className="cyber-tag">{day.toUpperCase()}</span>
        </div>
        <button onClick={() => navigate('/schedule')}
          className="font-mono text-xs text-slate-v hover:text-cyan-neon transition-colors tracking-wider">
          LIHAT SEMUA →
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.slice(0, 6).map((a, i) => (
          <button key={i} onClick={() => navigate(`/anime/${a.slug}`)}
            className="border-glow rounded p-3 text-left hover:bg-cyan-neon/5 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-cyan-neon">{a.time || '??:??'}</span>
            </div>
            <p className="text-xs text-ice font-medium line-clamp-2 leading-tight group-hover:text-cyan-neon transition-colors">
              {a.title}
            </p>
            {a.score && (
              <p className="font-mono text-xs text-slate-v mt-1">★ {a.score}</p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [terbaru, setTerbaru] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = getTodayEn();

  useEffect(() => {
    Promise.all([
      fetchTerbaru(1),
      fetchSchedule(today, 0),
    ])
      .then(([tb, sched]) => {
        setTerbaru(tb.results || []);
        setTodaySchedule(sched.anime_list || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [today]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"/>
        <p className="font-mono text-xs text-slate-v tracking-widest animate-pulse">LOADING VERONIME...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center border-glow rounded p-8 max-w-md">
        <p className="font-orbitron text-red-400 mb-3">GAGAL MEMUAT DATA</p>
        <p className="font-mono text-xs text-slate-v mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="cyber-tag cursor-pointer hover:text-cyan-neon">RETRY</button>
      </div>
    </div>
  );

  return (
    <div>
      <HeroSection anime={terbaru[0] || null}/>
      <AnimeRow title="ANIME TERBARU" tag="LIVE" items={terbaru} viewAllLink="/ongoing" usePosterApi={true}/>
      <TodaySchedule items={todaySchedule} day={today}/>
    </div>
  );
}
