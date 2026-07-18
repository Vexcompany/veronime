import { useRef, useState, useEffect } from 'react';

const DIRECT_MEDIA = /\.(mp4|webm|m3u8|mkv|mov|ts)(\?|#|$)/i;

export default function VideoPlayer({ src, title, onError, embed }) {
  // Mode embed: iframe untuk mirror host (odstream, filelions, mega, dsb)
  if (src && (embed || !DIRECT_MEDIA.test(src))) {
    return (
      <div className="relative w-full aspect-video bg-black rounded overflow-hidden border border-slate-v">
        <iframe
          key={src}
          src={src}
          title={title || 'Video Player'}
          className="w-full h-full"
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin"
          allowFullScreen
        />
      </div>
    );
  }

  return <Html5Player src={src} title={title} onError={onError}/>;
}

function Html5Player({ src, title, onError }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const hideRef = useRef(null);

  const showCtrl = () => {
    setShowControls(true);
    clearTimeout(hideRef.current);
    if (playing) {
      hideRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    if (!src) return;
    const v = videoRef.current;
    if (!v) return;
    v.src = src;
    v.load();
  }, [src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const handleProgress = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100 || 0);
    if (v.buffered.length > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100 || 0);
    }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const toggleFS = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const skip = (secs) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + secs));
  };

  if (!src) {
    return (
      <div className="w-full aspect-video bg-abyss border border-slate-v rounded flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full border-2 border-slate-v flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-v" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p className="font-mono text-xs text-slate-v">SELECT AN EPISODE TO PLAY</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded overflow-hidden group"
      onMouseMove={showCtrl}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleProgress}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={onError}
        onClick={togglePlay}
        style={{ cursor: showControls ? 'default' : 'none' }}
      />

      {/* Controls overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <p className="font-orbitron text-xs text-ice tracking-wider truncate">{title}</p>
        </div>

        {/* Center controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <button onClick={() => skip(-10)} className="text-white/70 hover:text-cyan-neon transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/>
              <text x="7" y="16" fontSize="7" fill="currentColor" fontFamily="monospace">10</text>
            </svg>
          </button>
          <button onClick={togglePlay}
            className="w-14 h-14 rounded-full border-2 border-cyan-neon bg-abyss/60 backdrop-blur flex items-center justify-center hover:bg-cyan-neon/20 transition-colors"
            style={{ boxShadow: '0 0 20px rgba(0,194,255,0.4)' }}>
            {playing
              ? <svg className="w-6 h-6 text-cyan-neon" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg className="w-6 h-6 text-cyan-neon ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button onClick={() => skip(10)} className="text-white/70 hover:text-cyan-neon transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 3a9 9 0 1 1-9 9h2a7 7 0 1 0 7-7V3z"/>
              <text x="7" y="16" fontSize="7" fill="currentColor" fontFamily="monospace">10</text>
            </svg>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          {/* Progress */}
          <div className="relative h-1 mb-3 cursor-pointer group/bar" onClick={handleSeek}>
            <div className="absolute inset-0 bg-white/10 rounded"/>
            <div className="absolute left-0 top-0 h-full bg-white/20 rounded" style={{ width: `${buffered}%` }}/>
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-neon to-violet-elec rounded transition-all" style={{ width: `${progress}%` }}/>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-neon shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity"
                 style={{ left: `calc(${progress}% - 6px)`, boxShadow: '0 0 8px #00C2FF' }}/>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-cyan-neon transition-colors">
              {playing
                ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1">
              <button onClick={() => { setMuted(!muted); videoRef.current.muted = !muted; }}
                className="text-white hover:text-cyan-neon transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  {muted ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>}
                </svg>
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = +e.target.value; setVolume(v); videoRef.current.volume = v; if (v > 0) setMuted(false); }}
                className="w-16 h-1 accent-cyan-neon"/>
            </div>

            <span className="font-mono text-xs text-white/60 ml-1">{fmt(currentTime)} / {fmt(duration)}</span>

            <div className="ml-auto">
              <button onClick={toggleFS} className="text-white hover:text-cyan-neon transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {fullscreen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }}/>
    </div>
  );
}
