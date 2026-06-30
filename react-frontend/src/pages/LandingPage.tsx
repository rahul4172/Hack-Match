import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, Sparkles, Cpu, ArrowRight, Heart, Globe, Users, Trophy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../store/useAuth';
import { useMousePosition } from '../hooks/useMousePosition';
import { fetchAPI } from '../lib/api';
import { CursorSpotlight } from '../components/layout/MeshBackground';

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

// -- Magnetic Button Component --
function MagneticButton({ children, onClick, className = '' }: any) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`relative inline-flex items-center justify-center gap-2 group px-8 py-4 rounded-full font-bold text-white transition-colors z-50 ${className}`}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF] opacity-80 blur-md transition-opacity group-hover:opacity-100 animate-spin-border"></div>
      <div className="absolute inset-[1px] rounded-full bg-[#0D1117] transition-colors group-hover:bg-[#161B22]"></div>
      <span className="relative flex items-center gap-2 z-10 font-mono tracking-widest uppercase">
        {children}
      </span>
    </motion.button>
  );
}

// -- Bento Card Component (Mouse Tracking Gradient) --
function BentoCard({ children, className = '' }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`bento-card p-8 flex flex-col justify-between ${className}`}
      style={{
        '--mouse-x': `${mousePosition.x}px`,
        '--mouse-y': `${mousePosition.y}px`,
      } as React.CSSProperties}
    >
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

// -- Hero Floating Card Mockup --
function FloatingMockupCard({ delay, rotate, x, y, name, role, avatar, badge }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y, x, rotate, scale: 1 }}
      transition={{ duration: 1, delay, type: 'spring', bounce: 0.4 }}
      className={`absolute w-64 p-4 rounded-2xl glass-card border border-white/10 shadow-2xl backdrop-blur-2xl bg-[#0D1117]/80 hidden md:block ${delay % 2 === 0 ? 'animate-float-slow' : 'animate-float-slower'}`}
      style={{ zIndex: 10 + Math.floor(delay * 10) }}
    >
      <div className="flex gap-3 items-center mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#58A6FF]/50 shrink-0 shadow-[0_0_15px_rgba(88,166,255,0.3)]">
          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white leading-tight">{name}</h4>
          <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">{role}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.text}</span>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mouse = useMousePosition();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const scrambleWord = useScrambleText(['Squad', 'Team', 'Co-Founder', 'Partner']);

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);

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

  const TechMarquee = () => {
    const tech = ['React', 'Next.js', 'Tailwind', 'Node.js', 'Python', 'TypeScript', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Framer Motion'];
    return (
      <div className="w-full overflow-hidden py-10 rotate-[-2deg] scale-110 bg-[#BC8CFF]/5 border-y border-[#BC8CFF]/10 backdrop-blur-sm relative z-0">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...tech, ...tech, ...tech].map((t, i) => (
            <span key={i} className="mx-8 text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white/20 to-white/5 uppercase tracking-widest opacity-50">
              {t} <span className="text-[#BC8CFF]/30 mx-4">•</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010409] text-[#C9D1D9] selection:bg-[#BC8CFF]/30 overflow-x-hidden">
      <CursorSpotlight x={mouse.x} y={mouse.y} />
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#58A6FF]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#BC8CFF]/10 blur-[120px]" />
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        
        {/* Floating Ecosystem Background */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40 sm:opacity-100">
          <FloatingMockupCard delay={0.1} rotate={-12} x={-350} y={-100} name="Alex Chen" role="Full Stack Developer" avatar="https://i.pravatar.cc/150?u=alex" badge={{text: "React Master", color: "text-[#58A6FF] border-[#58A6FF]/30 bg-[#58A6FF]/10"}} />
          <FloatingMockupCard delay={0.3} rotate={8} x={350} y={-50} name="Sarah Jones" role="UI/UX Designer" avatar="https://i.pravatar.cc/150?u=sarah" badge={{text: "Figma Pro", color: "text-[#BC8CFF] border-[#BC8CFF]/30 bg-[#BC8CFF]/10"}} />
          <FloatingMockupCard delay={0.5} rotate={-5} x={-280} y={150} name="David Kim" role="AI Researcher" avatar="https://i.pravatar.cc/150?u=david" badge={{text: "Python Guru", color: "text-[#3FB950] border-[#3FB950]/30 bg-[#3FB950]/10"}} />
          <FloatingMockupCard delay={0.7} rotate={15} x={250} y={180} name="Emily Davis" role="Backend Engineer" avatar="https://i.pravatar.cc/150?u=emily" badge={{text: "Node.js", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"}} />
          
          {/* Laser connection line SVG */}
          <svg className="absolute inset-0 w-full h-full hidden md:block" style={{ filter: 'drop-shadow(0 0 10px rgba(188, 140, 255, 0.5))' }}>
             <motion.path 
                d="M 250 150 Q 500 250 750 150" 
                fill="transparent" 
                stroke="url(#gradient)" 
                strokeWidth="2"
                strokeDasharray="10,10"
                className="animate-marquee"
                style={{ strokeDashoffset: mouse.x * 0.1 }}
             />
             <defs>
               <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#58A6FF" stopOpacity="0.1" />
                 <stop offset="50%" stopColor="#BC8CFF" stopOpacity="1" />
                 <stop offset="100%" stopColor="#3FB950" stopOpacity="0.1" />
               </linearGradient>
             </defs>
          </svg>
        </div>

        <motion.div 
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-[#BC8CFF]" />
            <span className="text-xs font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#BC8CFF] to-[#58A6FF]">
              Hackathon matchmaking, reimagined.
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight font-display mb-6 leading-tight"
          >
            Find Your <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] via-[#BC8CFF] to-[#3FB950] animate-shimmer-text">
              {scrambleWord}.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl text-[#8B949E] max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            The smoothest way to find hackathon teammates — ranked by skills, availability, and vibe.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <MagneticButton onClick={() => user ? navigate('/discover') : navigate('/signup')}>
              Enter App <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
            
            {!user && (
              <Button 
                variant="ghost" 
                size="lg"
                onClick={handleGuestLogin}
                disabled={loadingGuest}
                className="font-mono uppercase tracking-widest text-sm text-[#8B949E] hover:text-white mt-4 sm:mt-0"
              >
                {loadingGuest ? 'Entering...' : 'Try as Guest'}
              </Button>
            )}
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ y: y1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 hidden sm:flex"
        >
          <span className="text-xs font-mono tracking-widest uppercase">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
        </motion.div>
      </section>

      {/* --- MARQUEE --- */}
      <TechMarquee />

      {/* --- BENTO BOX FEATURES --- */}
      <section className="relative py-32 px-4 sm:px-6 max-w-7xl mx-auto z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-black text-white font-display mb-4">
            Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BC8CFF] to-[#58A6FF]">win.</span>
          </h2>
          <p className="text-[#8B949E] max-w-xl mx-auto text-lg">Stop scrolling Discord channels. Start building.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto md:auto-rows-[300px]">
          {/* Box 1: Large */}
          <BentoCard className="md:col-span-2 md:row-span-2 group min-h-[400px] md:min-h-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#58A6FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[100px] pointer-events-none rounded-full" />
            <Search className="w-10 h-10 text-[#58A6FF] mb-6" />
            <h3 className="text-3xl font-black text-white mb-4">Algorithmic Matching</h3>
            <p className="text-[#8B949E] text-lg max-w-md">Our matching engine pairs you with teammates based on overlapping skills, complementary roles, and timezone availability. It's like magic.</p>
            
            <div className="absolute bottom-8 right-8 w-48 h-48 sm:w-64 sm:h-64 opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block">
               <div className="relative w-full h-full">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-[#58A6FF]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#BC8CFF]/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                 <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#58A6FF]" />
               </div>
            </div>
          </BentoCard>

          {/* Box 2 */}
          <BentoCard className="group min-h-[250px] md:min-h-0">
            <Globe className="w-8 h-8 text-[#BC8CFF] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Global Network</h3>
            <p className="text-[#8B949E] text-sm">Find teammates near you, or across the globe. Built-in geolocation matching.</p>
          </BentoCard>

          {/* Box 3 */}
          <BentoCard className="group overflow-visible min-h-[250px] md:min-h-0">
            <Trophy className="w-8 h-8 text-[#3FB950] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Gamified Profiles</h3>
            <p className="text-[#8B949E] text-sm mb-4">Earn XP, level up, and unlock legendary ranks as you build.</p>
            <div className="mt-auto bg-[#161B22] border border-[#3FB950]/30 rounded-lg p-3 flex justify-between items-center transform group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(63,185,80,0.1)]">
              <span className="text-xs font-mono font-bold text-white">Lvl 42 Architect</span>
              <span className="text-xs text-[#3FB950] font-mono">+50 XP</span>
            </div>
          </BentoCard>

          {/* Box 4: Wide */}
          <BentoCard className="md:col-span-3 min-h-[300px] md:min-h-0">
             <div className="flex flex-col md:flex-row gap-8 items-center h-full">
               <div className="flex-1">
                 <Users className="w-10 h-10 text-white mb-6" />
                 <h3 className="text-3xl font-black text-white mb-4">Squad Management</h3>
                 <p className="text-[#8B949E] text-lg">Create a squad, invite members with a secret join code, and manage your hackathon team from one powerful dashboard.</p>
               </div>
               <div className="flex-1 flex justify-center md:justify-end">
                 <div className="flex -space-x-4">
                   {[1,2,3,4].map((i) => (
                     <div key={i} className="w-16 h-16 rounded-full border-4 border-[#0D1117] bg-[#161B22] overflow-hidden shadow-xl z-10 hover:scale-110 hover:z-20 transition-all cursor-pointer">
                        <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="avatar" />
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </BentoCard>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="relative py-32 px-4 border-t border-white/5 bg-gradient-to-b from-transparent to-[#BC8CFF]/5">
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <h2 className="text-5xl sm:text-7xl font-black text-white font-display mb-8">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BC8CFF] to-[#58A6FF]">ship?</span>
          </h2>
          <MagneticButton onClick={() => user ? navigate('/discover') : navigate('/signup')} className="scale-110">
            Join the Network
          </MagneticButton>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm font-mono text-[#8B949E] border-t border-white/5">
        <p className="flex items-center justify-center gap-2">Built with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> for Hackathons</p>
      </footer>
    </div>
  );
}
