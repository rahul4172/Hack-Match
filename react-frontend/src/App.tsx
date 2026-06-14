import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MatrixBackground } from './components/ui/MatrixBackground';
import { useAuth } from './store/useAuth';
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

function NavBar() {
  const location = useLocation();
  // Hide nav on landing page for a cleaner look
  if (location.pathname === '/') return null;

  return (
    <nav className="fixed top-0 w-full z-50 ultra-glass border-b-0 border-white/5 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300">
      <div className="flex gap-4 md:gap-6 items-center flex-1 justify-center w-full overflow-x-auto custom-scrollbar pb-1 md:pb-0">
        {[
          { path: '/discover', label: 'Discover' },
          { path: '/radar', label: 'Radar' },
          { path: '/connections', label: 'Network' },
          { path: '/chat', label: 'Terminal' },
          { path: '/spotlight', label: 'Spotlight' }
        ].map(link => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`text-xs md:text-sm font-mono tracking-widest uppercase transition-colors whitespace-nowrap hover:text-[#58A6FF] ${location.pathname === link.path ? 'text-[#58A6FF] text-glow font-bold' : 'text-[#8B949E]'}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-4 items-center hidden sm:flex">
        <Link to="/profile" className="text-xs md:text-sm font-mono text-[#58A6FF] hover:text-[#58A6FF]/80 transition-colors">
          [ Profile ]
        </Link>
        <button onClick={() => { localStorage.removeItem('token'); window.location.href='/'; }} className="text-xs md:text-sm font-mono text-[#8B949E] hover:text-red-400 transition-colors">
          Log Out
        </button>
      </div>
    </nav>
  );
}

function App() {
  const { initialize, loading } = useAuth();
  const [godMode, setGodMode] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
    return <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-[#58A6FF] font-mono">Initializing System...</div>;
  }

  return (
    <Router>
      <div className={`relative min-h-screen bg-[#0D1117] text-[#C9D1D9] font-sans selection:bg-[#58A6FF]/30 overflow-hidden ${godMode ? 'matrix-theme' : ''}`}>
        
        {/* Global AI Aesthetics */}
        <div className="fixed inset-0 pointer-events-none z-[-1]">
          <div className="ai-orb-1 top-[10%] left-[20%]"></div>
          <div className="ai-orb-2 bottom-[20%] right-[10%]"></div>
          <div className="ai-orb-3 top-[40%] left-[60%]"></div>
        </div>

        {godMode && <MatrixBackground />}
        
        <NavBar />

        <div className="relative z-10 pt-16">
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
