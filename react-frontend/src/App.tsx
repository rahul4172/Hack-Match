import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MeshBackground } from './components/layout/MeshBackground';
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

import { Search, Radar, Globe, Terminal, Sparkles, Menu, X, User, LogOut } from 'lucide-react';

const NAV_LINKS = [
  { path: '/discover', label: 'Discover', icon: Search },
  { path: '/radar', label: 'Radar', icon: Radar },
  { path: '/connections', label: 'Network', icon: Globe },
  { path: '/chat', label: 'Terminal', icon: Terminal },
  { path: '/spotlight', label: 'Spotlight', icon: Sparkles },
];

function NavBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user: _user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (location.pathname === '/') return null;

  const logout = async () => {
    try { await API.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-[#050508]/80 backdrop-blur-[20px] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-transparent'
        } px-4 md:px-8 py-4 flex justify-between items-center`}
      >
        <Link to="/discover" className="flex items-center gap-2 z-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/20">
            <span className="text-white font-bold font-display text-sm tracking-tighter">HM</span>
          </div>
          <span className="text-white font-display font-bold text-lg tracking-tight hidden sm:block">
            HackMatch
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-1 items-center bg-white/5 border border-white/10 rounded-full px-2 py-1.5 backdrop-blur-md shadow-inner">
          {NAV_LINKS.map(link => {
            const active = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path}>
                <motion.span
                  whileHover={{ y: -1 }}
                  className={`relative flex items-center gap-2 text-sm font-display font-medium px-4 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    active ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-full bg-white/10 -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.span>
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA / Profile */}
        <div className="hidden md:flex gap-3 items-center">
          <Link to="/profile" className="text-sm font-display font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
            Profile
          </Link>
          <button onClick={logout} className="btn-primary text-sm px-5 py-2">
            Log Out
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-slate-300 hover:text-white transition-colors p-2 -mr-2 rounded-lg hover:bg-white/5 z-50"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#050508]/80 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-64 glass-card z-50 md:hidden flex flex-col rounded-l-[28px] rounded-r-none border-r-0 border-t-0 border-b-0 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 flex justify-end">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 p-5 pt-0 flex-1">
                {NAV_LINKS.map(link => {
                  const active = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-display transition-all ${
                        active
                          ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] font-semibold border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}

                <div className="border-t border-white/10 my-4 mx-2" />
                
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-display text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <User className="w-5 h-5" /> Profile
                </Link>
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-display text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-red-300 transition-colors text-left w-full mt-auto mb-4 border border-transparent hover:border-[#EF4444]/20">
                  <LogOut className="w-5 h-5" /> Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const { initialize, loading } = useAuth();
  const [godMode, setGodMode] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => { API.get('/health').catch(() => setBackendUnreachable(true)); }, []);

  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let konamiIndex = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setGodMode(true);
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
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-[#58A6FF]/30 border-t-[#58A6FF]"
        />
        <span className="text-[#58A6FF] font-mono text-sm text-glow-cyan">Initializing System...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className={`relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans overflow-hidden ${godMode ? 'matrix-theme' : ''}`}>
        {backendUnreachable && (
          <div className="bg-red-600/90 text-white text-center py-2 text-xs sm:text-sm z-[100] relative font-mono px-4">
            Backend unreachable — check {import.meta.env.VITE_API_URL || 'API URL'}
          </div>
        )}
        <MeshBackground />
        {godMode && <MatrixBackground />}
        <NavBar />

        <div className="relative z-10 pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-16 md:pb-0">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/profile" element={<ProfileEditPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/radar" element={<RadarPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/spotlight" element={<SpotlightPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
