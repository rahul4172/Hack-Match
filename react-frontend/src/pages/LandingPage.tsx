import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../store/useAuth';
import { useEffect, useState } from 'react';
import { SubscriptionModal } from '../components/ui/SubscriptionModal';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/discover');
    }
  }, [user, navigate]);

  const [showModal, setShowModal] = useState(false);
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
        setTimeout(() => setIsTypingComplete(true), 1500); // Wait then transition
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleLoginClick = () => {
    setShowModal(true);
  };

  const proceedToSignIn = () => {
    setShowModal(false);
    navigate('/signin');
  };
  return (
    <main className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Floating Developer Cards (Parallax Simulation) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[15%] left-[5%] animate-[float_15s_ease-in-out_infinite] glass p-4 rounded-xl border border-blue-500/20 transform -rotate-12 w-64">
          <div className="text-xs font-bold text-white">Frontend Developer</div>
          <div className="text-[10px] text-blue-400 font-mono">React Lover 💙</div>
        </div>
        <div className="absolute bottom-[20%] left-[10%] animate-[float_20s_ease-in-out_infinite_reverse] glass p-4 rounded-xl border border-green-500/20 transform rotate-12 w-64">
          <div className="text-xs font-bold text-white">Backend Engineer</div>
          <div className="text-[10px] text-green-400 font-mono">Node.js 🟢</div>
        </div>
        <div className="absolute top-[30%] right-[5%] animate-[float_18s_ease-in-out_infinite] glass p-4 rounded-xl border border-purple-500/20 transform rotate-6 w-64">
          <div className="text-xs font-bold text-white">AI Engineer</div>
          <div className="text-[10px] text-purple-400 font-mono">Python 🐍</div>
        </div>
      </div>

      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col text-center relative">
        {/* Glow behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[150px] bg-[#58A6FF]/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="h-24 flex items-center justify-center mb-6">
          {!isTypingComplete ? (
            <h1 className="text-4xl md:text-6xl font-mono tracking-tighter text-[#58A6FF]">
              {typedText}<span className="animate-pulse">|</span>
            </h1>
          ) : (
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF] drop-shadow-lg animate-in fade-in zoom-in duration-500">
              Match Found ❤️
            </h1>
          )}
        </div>
        
        <p className="text-2xl text-[#C9D1D9] mb-12 max-w-2xl font-light tracking-wide transition-opacity duration-500">
          Swipe. Match. Build.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Button 
            size="lg" 
            variant="primary" 
            className="shadow-[0_0_20px_rgba(88,166,255,0.4)] text-lg px-8 py-4 bg-[#58A6FF] hover:bg-[#58A6FF]/80 text-[#0D1117] font-bold"
            onClick={handleLoginClick}
          >
            [ Start Swiping ]
          </Button>
          <Button size="lg" variant="ghost" className="font-mono text-sm text-[#C9D1D9] hover:text-white" onClick={handleLoginClick}>
            View Live Network
          </Button>
        </div>
      </div>
      
      {showModal && (
        <SubscriptionModal 
          onClose={() => setShowModal(false)} 
          onSubscribe={proceedToSignIn} 
        />
      )}
      
      {/* Decorative bottom bar */}
      <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </main>
  );
}
