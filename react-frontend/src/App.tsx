import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MatrixBackground } from './components/ui/MatrixBackground';
import { useAuth } from './store/useAuth';
import API from './lib/api';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DiscoverPage from './pages/DiscoverPage';
import ChatPage from './pages/ChatPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ConnectionsPage from './pages/ConnectionsPage';
import SpotlightPage from './pages/SpotlightPage';
import RadarPage from './pages/RadarPage';

const NAV_LINKS = [
  { path: '/discover', label: 'Discover', icon: '🔍' },
  { path: '/radar',    label: 'Radar',    icon: '📡' },
  { path: '/connections', label: 'Network', icon: '🌐' },
  { path: '/chat',     label: 'Terminal', icon: '💻' },
  { path: '/spotlight',label: 'Spotlight',icon: '🔦' },
];

function NavBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === '/') return null;

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch (e) {}
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      {/* ── Desktop nav ── */}
      <nav className="fixed top-0 w-full z-50 ultra-glass border-b border-white/5 px-4 md:px-6 py-3 hidden md:flex justify-between items-center transition-all duration-300">
        <div className="flex gap-6 items-center">
          {NAV_LINKS.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-mono tracking-widest uppercase transition-colors whitespace-nowrap hover:text-[#58A6FF] ${location.pathname === link.path ? 'text-[#58A6FF] font-bold' : 'text-[#8B949E]'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/profile" className="text-sm font-mono text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors">
            [ Profile ]
          </Link>
          <button
            onClick={logout}
            className="text-sm font-mono text-[#8B949E] hover:text-red-400 transition-colors"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <nav className="fixed top-0 w-full z-50 ultra-glass border-b border-white/5 px-4 py-3 flex md:hidden justify-between items-center">
        <span className="text-[#58A6FF] font-mono font-bold text-sm tracking-widest">HACKMATCH</span>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="text-[#8B949E] hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Mobile slide-down menu ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-14 left-0 right-0 ultra-glass border-b border-white/10 shadow-2xl py-4 px-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono uppercase tracking-wider transition-colors ${
                    location.pathname === link.path
                      ? 'bg-[#58A6FF]/10 text-[#58A6FF] font-bold'
                      : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/10 my-2" />
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono text-[#58A6FF] hover:bg-[#58A6FF]/10 transition-colors"
              >
                <span>👤</span> Profile
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-mono text-[#8B949E] hover:bg-red-500/10 hover:text-red-400 transition-colors text-left w-full"
              >
                <span>🚪</span> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden ultra-glass border-t border-white/5 flex justify-around items-center py-2 px-2">
        {NAV_LINKS.map(link => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${active ? 'text-[#58A6FF]' : 'text-[#8B949E]'}`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${active ? 'font-bold' : ''}`}>{link.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-[#58A6FF] mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </>
  );
}

function App() {
  const { initialize, loading } = useAuth();
  const [godMode, setGodMode] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    API.get('/health').catch(() => setBackendUnreachable(true));
  }, []);

  // Konami Code listener
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setGodMode(true);
          alert('💻 Developer God Mode Activated');
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#58A6FF] font-mono text-glow">Initializing System...</div>;
  }

  return (
    <Router>
      <div className={`relative min-h-screen bg-[#050505] text-[#C9D1D9] font-sans selection:bg-[#BC8CFF]/40 overflow-hidden ${godMode ? 'matrix-theme' : ''}`}>
        {backendUnreachable && (
          <div className="bg-red-600 text-white text-center py-2 text-xs sm:text-sm z-[100] relative font-mono px-4">
            ⚠️ Backend Unreachable at {import.meta.env.VITE_API_URL} — Check Configuration
          </div>
        )}

        {/* Global AI Aesthetics */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          <div className="aurora-bg"></div>
          <div className="ai-orb-1 top-[-10%] left-[-10%]"></div>
          <div className="ai-orb-2 bottom-[-20%] right-[-10%]"></div>
          <div className="ai-orb-3 top-[30%] left-[50%]"></div>
        </div>

        {godMode && <MatrixBackground />}

        <NavBar />

        {/* pt-14 on mobile (top bar), pb-16 on mobile (bottom tab bar), pt-16 on desktop */}
        <div className="relative z-10 pt-14 pb-16 md:pt-16 md:pb-0">
          <Routes>
            <Route path="/"           element={<LandingPage />} />
            <Route path="/signin"     element={<SignInPage />} />
            <Route path="/signup"     element={<SignUpPage />} />
            <Route path="/profile"    element={<ProfileEditPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/discover"   element={<DiscoverPage />} />
            <Route path="/radar"      element={<RadarPage />} />
            <Route path="/connections"element={<ConnectionsPage />} />
            <Route path="/chat"       element={<ChatPage />} />
            <Route path="/spotlight"  element={<SpotlightPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
