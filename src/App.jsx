import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AnimeDetail from './pages/AnimeDetail';
import BrowsePage from './pages/BrowsePage';
import SearchPage from './pages/SearchPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen aurora-bg">
        <Navbar/>
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/anime/:slug" element={<AnimeDetail/>}/>
            <Route path="/ongoing" element={<BrowsePage/>}/>
            <Route path="/popular" element={<BrowsePage/>}/>
            <Route path="/movies" element={<BrowsePage/>}/>
            <Route path="/search" element={<SearchPage/>}/>
          </Routes>
        </main>
        {/* Footer */}
        <footer className="border-t border-slate-v/30 mt-20 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-neon to-violet-elec opacity-80"
                   style={{clipPath:'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}/>
              <span className="absolute inset-0 flex items-center justify-center text-white font-orbitron font-black text-xs" style={{fontSize:'7px'}}>V</span>
            </div>
            <span className="font-orbitron font-bold text-sm gradient-text tracking-widest">VERONIME</span>
          </div>
          <p className="font-mono text-xs text-slate-v">WATCH ANIME. FEEL THE FUTURE.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
