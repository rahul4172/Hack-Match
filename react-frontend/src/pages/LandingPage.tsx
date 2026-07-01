import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Code2, Heart, Smartphone, Database, Palette, Shield, Terminal, Code, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';

// -- Scramble Text Effect (Hero) --
const SCRAMBLE_CHARS = '!<>-_\\\\/[]{}—=+*^?#________';
const useScrambleText = (words: string[]) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const nextWord = words[(index + 1) % words.length];
    
    const scramble = async () => {
      // Out
      for (let i = text.length; i >= 0; i--) {
        await new Promise(r => setTimeout(r, 40));
        setText(text.substring(0, i) + SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)].repeat(Math.max(0, text.length - i)));
      }
      // In
      for (let i = 0; i <= nextWord.length; i++) {
        await new Promise(r => setTimeout(r, 40));
        setText(nextWord.substring(0, i) + SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)].repeat(Math.max(0, nextWord.length - i)));
      }
      setText(nextWord);
      timeout = setTimeout(() => setIndex((index + 1) % words.length), 3000);
    };

    timeout = setTimeout(scramble, 3000);
    return () => clearTimeout(timeout);
  }, [index, text, words]);

  return text;
};

// --- Abstract Swipe Stack Component ---
const SKILL_CARDS = [
  { id: 1, title: 'Frontend Developer', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 2, title: 'Backend Engineer', icon: Database, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  { id: 3, title: 'UX/UI Designer', icon: Palette, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { id: 4, title: 'Security Expert', icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  { id: 5, title: 'DevOps Wizard', icon: Terminal, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
];

function AutoSwipeDeck() {
  const [cards, setCards] = useState(SKILL_CARDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        const newCards = [...prev];
        const first = newCards.shift();
        if (first) newCards.push(first);
        return newCards;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm aspect-[3/4] mx-auto perspective-1000">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isTop = index === 0;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ 
                scale: 1 - index * 0.05, 
                opacity: 1 - index * 0.2, 
                y: index * 20,
                zIndex: cards.length - index
              }}
              exit={{ x: 200, opacity: 0, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`absolute top-0 left-0 w-full h-full rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl bg-[#161B22] flex flex-col p-8 overflow-hidden`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-auto ${card.bg} ${card.border} border`}>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{card.title}</h3>
                <div className="flex gap-2 mb-4">
                  <span className="w-16 h-2 rounded-full bg-white/10"></span>
                  <span className="w-12 h-2 rounded-full bg-white/10"></span>
                  <span className="w-20 h-2 rounded-full bg-white/10"></span>
                </div>
                <div className="flex gap-2">
                  <span className="w-10 h-10 rounded-full bg-white/5"></span>
                  <span className="w-10 h-10 rounded-full bg-white/5"></span>
                  <span className="w-10 h-10 rounded-full bg-white/5"></span>
                </div>
              </div>
              
              {/* Swipe right indicator */}
              {isTop && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                  className="absolute top-8 right-8 border-4 border-green-500 text-green-500 rounded-lg px-4 py-1 font-bold text-xl uppercase rotate-12"
                >
                  Match
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const scrambleWord = useScrambleText(['Squad', 'Team', 'Co-Founder', 'Partner']);

  const handleGuestLogin = async () => {
    setLoadingGuest(true);
    try {
      const res = await fetchAPI('/auth/guest-login', { method: 'POST' });
      localStorage.setItem('token', res.token);
      window.location.href = '/discover';
    } catch (err: any) {
      alert("Guest login failed: " + err.message);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="bg-transparent text-[#C9D1D9] selection:bg-white/20 overflow-x-hidden font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="relative flex flex-col md:flex-row items-center justify-center px-6 lg:px-20 z-10 max-w-7xl mx-auto gap-8 lg:gap-16 pt-32 md:pt-40 pb-20">
        
        {/* Left: Copy */}
        <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 mb-6"
          >
            <Zap className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
              Tinder for Hackathons
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-4 leading-[1.1]"
          >
            Find your next <br />
            <span className="text-white/50 border-b-2 border-white/20 pb-1 inline-block min-w-[200px]">
              {scrambleWord}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-[#8B949E] mb-8 leading-relaxed max-w-md"
          >
            Stop scrolling Discord. Swipe to find developers, designers, and builders based on their tech stack.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Button 
              size="lg" 
              onClick={() => user ? navigate('/discover') : navigate('/signup')}
              className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 h-auto text-base rounded-full flex items-center justify-center gap-2"
            >
              Start Swiping <ArrowRight className="w-4 h-4" />
            </Button>
            
            {!user && (
              <Button 
                variant="ghost" 
                size="lg"
                onClick={handleGuestLogin}
                disabled={loadingGuest}
                className="w-full sm:w-auto font-mono uppercase tracking-widest text-xs text-[#8B949E] hover:text-white px-6"
              >
                {loadingGuest ? 'Loading...' : 'Try as Guest'}
              </Button>
            )}
          </motion.div>
        </div>

        {/* Right: Abstract Swipe UI */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="flex-1 w-full flex justify-center lg:justify-end mt-4 md:mt-0 scale-90 lg:scale-100 origin-right"
        >
          <AutoSwipeDeck />
        </motion.div>
      </section>

      {/* --- THREE STEP FEATURES --- */}
      <section className="relative py-32 px-6 lg:px-20 max-w-7xl mx-auto z-10 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="flex flex-col items-start group">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-colors group-hover:bg-white group-hover:text-black text-white">
              <Code2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">1. Filter by Stack</h3>
            <p className="text-[#8B949E] text-lg leading-relaxed">
              Looking for a React dev or a Rust fanatic? Filter the pool of hackers by exactly what you need to build your project.
            </p>
          </div>

          <div className="flex flex-col items-start group">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-colors group-hover:bg-white group-hover:text-black text-white">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">2. Swipe to Match</h3>
            <p className="text-[#8B949E] text-lg leading-relaxed">
              Swipe right if their skills and vibe match your idea. Mutual swipes instantly open a chat channel to brainstorm.
            </p>
          </div>

          <div className="flex flex-col items-start group">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-colors group-hover:bg-white group-hover:text-black text-white">
              <Code className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">3. Form a Squad</h3>
            <p className="text-[#8B949E] text-lg leading-relaxed">
              Bring your matches together into a private Squad. Manage your hackathon submission, share repos, and ship it.
            </p>
          </div>

        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="relative py-32 px-6 border-t border-white/5 bg-[#161B22]/30">
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <Sparkles className="w-12 h-12 text-white/20 mb-6" />
          <h2 className="text-5xl sm:text-7xl font-black text-white mb-10 tracking-tight">
            Stop searching.<br />Start shipping.
          </h2>
          <Button 
            size="lg"
            onClick={() => user ? navigate('/discover') : navigate('/signup')} 
            className="bg-white text-black hover:bg-gray-200 font-bold px-12 py-5 text-xl rounded-full"
          >
            Create Your Profile
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 text-center text-sm font-mono text-[#8B949E] border-t border-white/5 bg-[#0D1117]">
        <p className="flex items-center justify-center gap-2">Designed for Hackers, by Hackers.</p>
      </footer>
    </div>
  );
}
