import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../store/useAuth';
import { useEffect, useState } from 'react';
import { fetchAPI } from '../lib/api';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/discover');
    }
  }, [user, navigate]);

  const [loadingGuest, setLoadingGuest] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  
  const targetText = 'const soulmate = findDeveloper();';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(targetText.slice(0, i));
      i++;
      if (i > targetText.length) {
        clearInterval(interval);
        setTimeout(() => setIsTypingComplete(true), 1500);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleStartGuest = async () => {
    setLoadingGuest(true);
    try {
      const res = await fetchAPI('/auth/guest', { method: 'POST' });
      useAuth.getState().signIn(res.token, res.user);
      navigate('/discover');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGuest(false);
    }
  };

  const proceedToSignIn = () => {
    navigate('/signin');
  };

  return (
    <main className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      
      {/* Floating Developer Cards — hidden on very small screens */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60 hidden sm:block">
        <div className="absolute top-[15%] left-[5%] animate-[float_15s_ease-in-out_infinite] ultra-glass p-5 rounded-2xl transform -rotate-12 w-48 md:w-64">
          <div className="text-sm font-bold text-white mb-1">Frontend Developer</div>
          <div className="text-xs text-[#58A6FF] font-mono">React Lover 💙</div>
        </div>
        <div className="absolute bottom-[20%] left-[10%] animate-[float_20s_ease-in-out_infinite_reverse] ultra-glass p-5 rounded-2xl transform rotate-12 w-48 md:w-64">
          <div className="text-sm font-bold text-white mb-1">Backend Engineer</div>
          <div className="text-xs text-[#3FB950] font-mono">Node.js 🟢</div>
        </div>
        <div className="absolute top-[30%] right-[5%] animate-[float_18s_ease-in-out_infinite] ultra-glass p-5 rounded-2xl transform rotate-6 w-48 md:w-64">
          <div className="text-sm font-bold text-white mb-1">AI Engineer</div>
          <div className="text-xs text-[#BC8CFF] font-mono">Python 🐍</div>
        </div>
      </div>

      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[120px] md:h-[150px] bg-[#58A6FF]/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="h-16 sm:h-20 md:h-24 flex items-center justify-center mb-6 px-2 w-full">
          {!isTypingComplete ? (
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF] break-all sm:break-normal text-glow">
              {typedText}<span className="animate-pulse text-[#58A6FF]">|</span>
            </h1>
          ) : (
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] via-[#BC8CFF] to-[#FF7B72] drop-shadow-2xl animate-in fade-in zoom-in duration-500">
              Match Found ❤️
            </h1>
          )}
        </div>
        
        <p className="text-lg sm:text-xl md:text-2xl text-[#C9D1D9] mb-10 max-w-2xl font-light tracking-wide transition-opacity duration-500 px-4">
          Swipe. Match. Build.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center w-full sm:w-auto px-4">
          <Button 
            size="lg" 
            variant="primary" 
            className="shadow-[0_0_30px_rgba(88,166,255,0.6)] text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 bg-[#58A6FF] hover:bg-white text-[#050505] font-bold w-full sm:w-auto transition-all duration-300 hover:scale-105"
            onClick={handleStartGuest}
            disabled={loadingGuest}
          >
            {loadingGuest ? 'Initializing...' : '[ Start Swiping ]'}
          </Button>
          <Button size="lg" variant="ghost" className="font-mono text-sm text-[#8B949E] hover:text-white w-full sm:w-auto hover:bg-white/5 transition-colors duration-300" onClick={proceedToSignIn}>
            Sign In / Register
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </main>
  );
}
