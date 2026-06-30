import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { Search, Radar, MessageSquare, Sparkles, Shield, CheckCircle2, Star, Cpu, ArrowRight, Code2, X, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../store/useAuth';
import { useMousePosition } from '../hooks/useMousePosition';
import { fetchAPI } from '../lib/api';
import { CursorSpotlight } from '../components/layout/MeshBackground';

// -- 1. Signature Moment: Scramble Text (Hero)
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

// -- 2. Signature Moment: Animated Count Up (Stats)
const AnimatedNumber = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, spring, value]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplay(Math.floor(latest));
    });
  }, [spring]);

  return <span ref={ref}>{display}</span>;
};

// -- 3. Signature Moment: Card Tilt
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`, transition: 'transform 0.5s ease-out' });
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={style} className={`glass-card ${className}`}>
      {children}
    </div>
  );
};

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mouse = useMousePosition();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const scrambleText = useScrambleText(['Find Your Squad.', 'Ship Faster.', 'Win Together.']);
  
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);

  const handleGuest = async () => {
    setLoadingGuest(true);
    try {
      const res = await fetchAPI('/auth/guest', { method: 'POST' });
      useAuth.getState().signIn(res.token, res.user);
      navigate('/discover');
    } catch (e) { console.error(e); }
    finally { setLoadingGuest(false); }
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
  };

  const containerVariant = {
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  return (
    <div className="relative noise-overlay text-[var(--text-primary)]">
      <CursorSpotlight x={mouse.x} y={mouse.y} />

      {/* 1. HERO SECTION */}
      <section className="min-h-[100svh] flex flex-col items-center justify-center section-padding pt-32 pb-16 text-center relative overflow-hidden">
        <motion.div style={{ y: yHero }} className="max-w-5xl mx-auto z-10 flex flex-col items-center">
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-glow)] bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-mono mb-8 font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Hackathon matchmaking, reimagined.
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUpVariant} className="font-display font-bold tracking-tight mb-6 w-full max-w-4xl" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', lineHeight: 1.05 }}>
            <span className="gradient-text block min-h-[1.2em]">{scrambleText}</span>
            <span className="text-slate-400 block mt-2 text-[0.45em] font-normal tracking-normal">Swipe. Match. Build.</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ delay: 0.1 }} className="text-[var(--text-secondary)] text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-body">
            The smoothest way to find hackathon teammates — ranked by skills, availability, and vibe.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-sm sm:max-w-none mx-auto mb-16">
            {user ? (
              <Button size="lg" onClick={() => navigate('/discover')} className="w-full sm:w-auto text-lg px-8 py-4">
                Enter App <ArrowRight className="w-5 h-5 ml-2 inline-block" />
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={handleGuest} disabled={loadingGuest} className="w-full sm:w-auto text-lg px-8 py-4">
                  {loadingGuest ? 'Initializing...' : 'Start Swiping — Free'}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/signin')} className="w-full sm:w-auto text-lg px-8 py-4 bg-white/5 border border-white/10 hover:border-white/20">
                  Sign In
                </Button>
              </>
            )}
          </motion.div>

          {/* Social Proof Strip */}
          <motion.div initial="hidden" animate="visible" variants={fadeUpVariant} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[var(--text-tertiary)] font-medium">
            <div className="flex -space-x-3">
              {['https://i.pravatar.cc/100?img=1', 'https://i.pravatar.cc/100?img=2', 'https://i.pravatar.cc/100?img=3', 'https://i.pravatar.cc/100?img=4'].map((src, i) => (
                <img key={i} src={src} alt="User" className="w-10 h-10 rounded-full border-2 border-[var(--bg-base)] object-cover shadow-lg" style={{ zIndex: 4 - i }} />
              ))}
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex gap-1 text-[var(--accent-tertiary)] mb-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <span>Trusted by <strong className="text-[var(--text-primary)]">2,400+</strong> developers</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. STATS BAR */}
      <section className="w-full border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-[var(--page-x)] py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-[var(--border-subtle)]">
            {[
              { label: 'Active Builders', value: 2450, suffix: '+' },
              { label: 'Teams Formed', value: 340, suffix: '+' },
              { label: 'Hackathons', value: 89, suffix: '' },
              { label: 'Match Rate', value: 94, suffix: '%' }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center px-4">
                <span className="text-4xl font-display font-bold text-[var(--text-primary)] mb-2">
                  <AnimatedNumber value={stat.value} />{stat.suffix}
                </span>
                <span className="text-[var(--text-tertiary)] font-mono text-sm uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES HIGHLIGHTS */}
      <section className="section-padding max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariant} className="flex flex-col items-center mb-16 text-center">
          <motion.h2 variants={fadeUpVariant} className="text-3xl md:text-5xl font-display font-bold mb-6">Designed for <span className="text-[var(--accent-secondary)]">Velocity</span>.</motion.h2>
          <motion.p variants={fadeUpVariant} className="text-[var(--text-secondary)] text-lg max-w-2xl">Everything you need to find the perfect team, validate your idea, and ship the winning project.</motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariant} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Card spanning 2 cols on Desktop */}
          <motion.div variants={fadeUpVariant} className="md:col-span-2">
            <div className="glass-card h-full p-8 md:p-12 relative overflow-hidden group animated-border">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[var(--accent-primary)] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity" />
              <Search className="w-12 h-12 text-[var(--accent-primary)] mb-6" />
              <h3 className="text-2xl font-display font-bold mb-4">Tinder-style Swiping</h3>
              <p className="text-[var(--text-secondary)] text-lg max-w-md">Stop scrolling endless Discord channels. We serve you developers perfectly matched to your stack, timezone, and hackathon goals. Swipe right to connect, left to pass.</p>
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariant}>
            <TiltCard className="h-full p-8 relative overflow-hidden group">
              <Radar className="w-10 h-10 text-[var(--accent-secondary)] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-display font-bold mb-3">Live Hackathon Radar</h3>
              <p className="text-[var(--text-secondary)]">Integrated with Devfolio and Devpost. Discover hackathons that match your tech stack instantly.</p>
            </TiltCard>
          </motion.div>

          <motion.div variants={fadeUpVariant}>
            <TiltCard className="h-full p-8 relative overflow-hidden group">
              <MessageSquare className="w-10 h-10 text-[var(--accent-success)] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-display font-bold mb-3">Encrypted Terminal</h3>
              <p className="text-[var(--text-secondary)]">Chat securely with potential teammates in a gorgeous, code-friendly terminal environment.</p>
            </TiltCard>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="md:col-span-2">
             <div className="glass-card h-full p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 group">
                <div className="flex-1">
                  <Shield className="w-10 h-10 text-[var(--accent-tertiary)] mb-6" />
                  <h3 className="text-2xl font-display font-bold mb-4">Stack Clash Gates</h3>
                  <p className="text-[var(--text-secondary)] text-lg mb-6">Verify skills before you commit. Challenge potential teammates to quick, automated mini-assessments tailored to their claimed tech stack.</p>
                  <ul className="space-y-3">
                    {['Automated grading', 'Real-time collaboration', 'Customizable difficulty'].map(feature => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                        <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl p-4 font-mono text-sm text-[#06B6D4] shadow-inner">
                  <p className="text-[#94A3B8] mb-2">// Stack verification challenge</p>
                  <p><span className="text-[#8B5CF6]">function</span> <span className="text-[#F8FAFC]">solve</span>(data) {'{'}</p>
                  <p className="pl-4 text-[#F59E0B]">return data.filter(Boolean);</p>
                  <p>{'}'}</p>
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[#10B981]">Passed (12ms)</span>
                    <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] rounded text-xs">Verified</span>
                  </div>
                </div>
             </div>
          </motion.div>

        </motion.div>
      </section>

      {/* 4. DEMO SECTION */}
      <section className="section-padding bg-[var(--bg-surface)] border-y border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
             <div className="aspect-[4/5] sm:aspect-square w-full max-w-md mx-auto glass-card border-[var(--border-glow)] shadow-[0_0_80px_rgba(139,92,246,0.15)] relative overflow-hidden flex flex-col">
                <div className="h-12 border-b border-[var(--border-subtle)] flex items-center px-4 gap-2 bg-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 p-6 flex flex-col gap-4 bg-[var(--bg-base)]">
                   <div className="w-full aspect-video rounded-lg bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800')] bg-cover bg-center border border-[var(--border-subtle)]" />
                   <h4 className="text-xl font-display font-bold mt-2">Alex Chen</h4>
                   <p className="text-[var(--text-secondary)] text-sm -mt-3">Fullstack · React, Node, Rust</p>
                   <div className="flex gap-2 mt-2">
                     <span className="px-3 py-1 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-mono">React</span>
                     <span className="px-3 py-1 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-xs font-mono">PostgreSQL</span>
                   </div>
                    <div className="mt-auto flex justify-center gap-6">
                      <div className="w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center text-red-500/50 hover:bg-red-500/10 transition-colors"><X className="w-6 h-6" /></div>
                      <div className="w-14 h-14 rounded-full border-2 border-[#10B981]/50 flex items-center justify-center text-[#10B981]/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-[#10B981]/10 transition-colors"><Heart className="w-6 h-6 fill-[#10B981]/20" /></div>
                   </div>
                </div>
             </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 leading-tight">Stop settling for mediocre teammates.</h2>
            <p className="text-[var(--text-secondary)] text-lg mb-8 leading-relaxed">Hackathons are won by the team, not just the idea. HackMatch uses a proprietary algorithm to analyze your skills, availability, and past projects to surface the perfect partners.</p>
            <Button size="lg" onClick={() => navigate('/discover')} className="flex items-center gap-2">
              Start Matching <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="section-padding max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
           <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Built for Winners</h2>
           <p className="text-[var(--text-secondary)]">Teams formed on HackMatch have won over $150k in prizes.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
             { name: "Sarah Jenkins", role: "Frontend Dev", quote: "Found an incredible backend dev 12 hours before the EthGlobal deadline. We ended up taking 2nd place overall.", avatar: "https://i.pravatar.cc/150?img=5" },
             { name: "Marcus Doe", role: "UI/UX Designer", quote: "The UI of HackMatch itself is what sold me. If they care this much about design, I knew the devs here would be top tier.", avatar: "https://i.pravatar.cc/150?img=11" },
             { name: "Priya Patel", role: "Smart Contract Dev", quote: "Stack clash verified my solidity skills before matching. Saved me hours of explaining my background to random strangers.", avatar: "https://i.pravatar.cc/150?img=9" }
          ].map((t, i) => (
             <TiltCard key={i} className="p-6 md:p-8 flex flex-col justify-between">
                <div className="flex text-[var(--accent-tertiary)] mb-6">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg italic text-[var(--text-primary)] mb-8 font-serif leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4 mt-auto border-t border-[var(--border-subtle)] pt-6">
                  <img src={t.avatar} className="w-12 h-12 rounded-full object-cover border border-white/10" alt={t.name} />
                  <div>
                    <h4 className="font-display font-bold text-sm">{t.name}</h4>
                    <span className="text-xs font-mono text-[var(--accent-primary)]">{t.role}</span>
                  </div>
                </div>
             </TiltCard>
          ))}
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="mt-20 border-t border-[var(--border-subtle)] relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-base)] to-[#8B5CF6]/10 -z-10" />
         <div className="max-w-4xl mx-auto text-center section-padding py-32">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">Ready to Build?</h2>
            <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">Join thousands of top-tier developers. Form your dream team today and ship something incredible this weekend.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGuest} className="px-10 py-4 text-lg shadow-[0_0_40px_rgba(139,92,246,0.3)]">
                Launch App
              </Button>
              <Button size="lg" variant="outline" className="px-10 py-4 text-lg bg-white/5 flex items-center justify-center gap-2">
                 <Code2 className="w-5 h-5" /> Star on GitHub
              </Button>
            </div>
         </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-12 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
              <img src="/logo.png?v=2" alt="HackMatch Logo" className="w-6 h-6 rounded object-contain" />
              <span className="font-display font-bold text-sm tracking-widest text-[var(--text-secondary)] uppercase">HackMatch</span>
           </div>
           <div className="flex gap-6 text-sm text-[var(--text-tertiary)] font-mono">
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors">GitHub</a>
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
           </div>
           <div className="text-xs text-[var(--text-tertiary)] text-center md:text-right">
              © 2026 HackMatch. All rights reserved.<br/>Built for the obsessed.
           </div>
         </div>
      </footer>

    </div>
  );
}
