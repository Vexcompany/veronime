import { useRef } from 'react';
import AnimeCard from './AnimeCard';
import { Link } from 'react-router-dom';

export default function AnimeRow({ title, tag, items = [], viewAllLink }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-neon to-violet-elec rounded-full"/>
          <h2 className="font-orbitron font-bold text-base md:text-lg text-ice tracking-wider">{title}</h2>
          {tag && <span className="cyber-tag">{tag}</span>}
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link to={viewAllLink} className="font-mono text-xs text-slate-v hover:text-cyan-neon transition-colors tracking-wider mr-2">
              VIEW ALL →
            </Link>
          )}
          <button onClick={() => scroll(-1)}
            className="w-7 h-7 rounded border border-slate-v hover:border-cyan-neon text-slate-v hover:text-cyan-neon transition-colors flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button onClick={() => scroll(1)}
            className="w-7 h-7 rounded border border-slate-v hover:border-cyan-neon text-slate-v hover:text-cyan-neon transition-colors flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div ref={scrollRef} className="scroll-x px-4 md:px-8">
        <div className="flex gap-4" style={{ width: 'max-content' }}>
          {items.map((anime, i) => (
            <div key={i} style={{ width: 160 }}>
              <AnimeCard anime={anime}/>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mt-8 mx-4 md:mx-8 h-px bg-gradient-to-r from-transparent via-slate-v/40 to-transparent"/>
    </section>
  );
}
