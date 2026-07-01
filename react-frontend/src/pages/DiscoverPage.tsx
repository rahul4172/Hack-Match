import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../store/useAuth';
import type { UserProfile } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { UserProfileCard } from '../components/ui/UserProfileCard';
import { Lightbulb, Search, Heart, User, Check, Zap } from 'lucide-react';
import { calculateLevelData, generateBadges } from '../lib/gamification';

// --- Filter Component ---
function FilterSidebar({
  rolesFilter, setRolesFilter, skillsFilter, setSkillsFilter, applyFilters
}: any) {
  const availableRoles = ['Frontend', 'Backend', 'Full Stack', 'AI Researcher', 'UI Designer'];
  const availableSkills = ['React', 'Node.js', 'Python', 'Tailwind', 'Docker', 'AWS', 'TypeScript'];

  const toggleRole = (r: string) => setRolesFilter((prev: string[]) => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const toggleSkill = (s: string) => setSkillsFilter((prev: string[]) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="bg-[#161B22] border border-white/10 rounded-2xl p-4 sm:p-6 sticky top-24 w-full md:w-64 shrink-0 shadow-2xl">
      <h3 className="font-bold text-white mb-4">Filters</h3>
      <div className="mb-6">
        <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-2">Roles</h4>
        <div className="flex flex-col gap-2">
          {availableRoles.map(r => (
            <label key={r} className="flex items-center gap-2 text-sm text-[#C9D1D9] cursor-pointer hover:text-white">
              <input type="checkbox" checked={rolesFilter.includes(r)} onChange={() => toggleRole(r)} className="accent-[#58A6FF] bg-black/50 border-white/20" />
              {r}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h4 className="text-xs font-mono text-[#8B949E] uppercase mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {availableSkills.map(s => {
            const active = skillsFilter.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSkill(s)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${active ? 'bg-[#58A6FF]/20 border-[#58A6FF] text-[#58A6FF]' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'}`}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>
      <Button variant="primary" className="w-full text-sm" onClick={applyFilters}>Apply Filters</Button>
    </div>
  );
}

// --- Tinder Swipe Card Component ---
function SwipeCard({ item, isTop, onSwipe, currentUserLocation }: any) {
  const isIdea = item.type === 'idea';
  const u = item;
  let skills: string[] = [];
  try { skills = JSON.parse(u.skills || '[]'); } catch (e) {}

  const stats = !isIdea ? calculateLevelData(u.hack_score || 0) : null;
  const badges = !isIdea ? generateBadges(u) : [];
  
  const distance = u.distance_km;
  const isNearYouTextMatch = !distance && currentUserLocation && u.location && (
    u.location.toLowerCase().includes(currentUserLocation.toLowerCase()) || 
    currentUserLocation.toLowerCase().includes(u.location.toLowerCase())
  );
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const handleDragEnd = (_e: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
    else if (info.offset.y < -100) onSwipe('up');
  };

  return (
    <motion.div
      layout
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate }}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={!isTop ? { scale: 0.95, opacity: 0.8, y: 10 } : { scale: 1, opacity: 1, y: 0 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, rotate: x.get() > 0 ? 15 : -15 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`absolute inset-0 w-full h-full ${isTop ? 'z-10 cursor-grab active:cursor-grabbing' : 'z-0 pointer-events-none'}`}
    >
      {/* Stamps */}
      {isTop && (
        <>
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-8 z-50 transform -rotate-12 pointer-events-none">
            <div className="border-4 border-[#3FB950] text-[#3FB950] text-3xl font-black px-4 py-1 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(63,185,80,0.5)] bg-black/40 backdrop-blur-md">MERGE</div>
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 right-8 z-50 transform rotate-12 pointer-events-none">
            <div className="border-4 border-red-500 text-red-500 text-3xl font-black px-4 py-1 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] bg-black/40 backdrop-blur-md">DROP</div>
          </motion.div>
          <motion.div style={{ opacity: superLikeOpacity }} className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 transform -rotate-6 pointer-events-none">
            <div className="border-4 border-[#BC8CFF] text-[#BC8CFF] text-3xl font-black px-4 py-1 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(188,140,255,0.5)] bg-black/40 backdrop-blur-md">STAR</div>
          </motion.div>
        </>
      )}

      <UserProfileCard
        name={isIdea ? u.title : u.name}
        age={!isIdea ? Math.floor(Math.random() * 6) + 18 : undefined}
        role={isIdea ? `By ${u.creator_name}` : u.role}
        avatar={u.avatar}
        level={stats?.level}
        xp={stats?.xp}
        badge={badges[0]}
        about={isIdea ? `"${u.pitch}"` : u.bio}
        stack={isIdea && u.roles_needed ? [...skills, `Needs: ${u.roles_needed}`] : skills}
        isIdea={isIdea}
        distance={distance}
        isNearYou={isNearYouTextMatch}
      />
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<any>(null);
  
  const [rolesFilter, setRolesFilter] = useState<string[]>([]);
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalMessage, setSignalMessage] = useState('');
  const [signalRole, setSignalRole] = useState('');

  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaPitch, setIdeaPitch] = useState('');
  const [ideaRoles, setIdeaRoles] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (rolesFilter.length > 0) query.append('roles', rolesFilter.join(','));
      if (skillsFilter.length > 0) query.append('skills', skillsFilter.join(','));
      if (searchQuery.trim() !== '') query.append('search', searchQuery.trim());

      const [usersData, signalsData] = await Promise.all([
        fetchAPI(`/users?${query.toString()}`),
        fetchAPI('/signals/active')
      ]);
      setUsers(usersData);
      setSignals(signalsData);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line
  }, [user]);

  const handlePostSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSignal = await fetchAPI('/signals', {
        method: 'POST',
        body: JSON.stringify({ message: signalMessage, role_needed: signalRole })
      });
      setSignals([newSignal, ...signals]);
      setShowSignalModal(false);
      setSignalMessage('');
      setSignalRole('');
    } catch (err: any) {
      alert(err.message || "Failed to post signal");
    }
  };

  const handlePostIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/ideas', {
        method: 'POST',
        body: JSON.stringify({ title: ideaTitle, pitch: ideaPitch, roles_needed: ideaRoles })
      });
      alert('Idea posted successfully!');
      setShowIdeaModal(false);
      setIdeaTitle('');
      setIdeaPitch('');
      setIdeaRoles('');
    } catch (err: any) {
      alert(err.message || "Failed to post idea");
    }
  };



  const handleConnect = async (receiverId: string) => {
    try {
      await fetchAPI('/connections/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      });
    } catch (err) {
      // ignore silently for swipe
    }
  };

  const onSwipe = (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= users.length) return;
    const currentItem = users[currentIndex] as any;
    const targetId = currentItem.type === 'idea' ? currentItem.creator_id : currentItem.id;

    if (direction === 'right' || direction === 'up') {
      handleConnect(targetId);
      if (Math.random() > 0.6) setMatchModal(currentItem); // Simulate random match for demo
    }
    
    setCurrentIndex(curr => curr + 1);
  };

  if (!user) return <div className="p-8 text-center mt-16 text-gray-500">Please sign in to discover developers.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row gap-8 items-start">
      
      {/* Sidebar Filters */}
      <div className="hidden md:block">
        <FilterSidebar 
          rolesFilter={rolesFilter} setRolesFilter={setRolesFilter} 
          skillsFilter={skillsFilter} setSkillsFilter={setSkillsFilter} 
          applyFilters={loadData} 
        />
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white font-mono tracking-wider">DISCOVER</h1>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {showFilters && (
        <div className="md:hidden w-full mb-6">
          <FilterSidebar 
            rolesFilter={rolesFilter} setRolesFilter={setRolesFilter} 
            skillsFilter={skillsFilter} setSkillsFilter={setSkillsFilter} 
            applyFilters={() => { loadData(); setShowFilters(false); }} 
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] overflow-hidden">
        
        {/* Search Bar */}
        <div className="w-full max-w-[360px] px-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by name, role, or bio..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="w-full bg-[#161B22] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#58A6FF] transition-colors"
            />
            <button 
              onClick={loadData}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#58A6FF]/20 text-[#58A6FF] text-xs px-3 py-1 rounded-full hover:bg-[#58A6FF]/30 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Swipe Stack Container */}
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-[#58A6FF]/20 border-t-[#58A6FF] animate-spin" />
          </div>
        ) : currentIndex < users.length ? (
          <div className="w-full h-full flex flex-col items-center justify-center pt-2 pb-6">
            <div className="relative w-[95%] max-w-[340px] flex-none h-[520px] sm:h-[560px] mb-6 perspective-1000">
              <AnimatePresence>
                {users.slice(currentIndex, currentIndex + 2).reverse().map((item, i, arr) => {
                  const isTop = i === arr.length - 1;
                  return (
                    <SwipeCard
                      key={(item as any).id + i}
                      item={item}
                      isTop={isTop}
                      onSwipe={onSwipe}
                      calculateLevelData={calculateLevelData}
                      generateBadges={generateBadges}
                      currentUserLocation={(user as any)?.location}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
            
            <div className="text-slate-500 text-xs font-medium flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner">
              <span className="hidden md:inline">💻 Desktop: Use Arrow Keys or Drag</span>
              <span className="md:hidden">📱 Mobile: Swipe Left/Right</span>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 glass rounded-3xl w-full max-w-[340px] mt-12 border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#58A6FF]/5 to-transparent pointer-events-none"></div>
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[#161B22] border border-white/10 flex items-center justify-center animate-pulse">
                <Search className="w-10 h-10 text-[#58A6FF]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Radar Empty</h2>
            <p className="text-gray-400 font-mono text-sm mb-8 leading-relaxed">No developers found in your current orbit. Expand your filters or broadcast a signal to the network.</p>
            <div className="flex flex-col gap-3 relative z-10">
              <Button onClick={() => setShowIdeaModal(true)} variant="outline" className="w-full flex justify-center items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Post an Idea
              </Button>
              <Button onClick={() => setShowSignalModal(true)} variant="primary" className="w-full flex justify-center items-center gap-2">
                <Zap className="w-4 h-4" /> Broadcast Signal
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Match Modal */}
      {matchModal && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in zoom-in duration-500">
          <div className="absolute inset-0 aurora-bg opacity-30"></div>
          <div className="mb-6 animate-bounce">
            <Heart className="w-20 h-20 text-[#3FB950] fill-[#3FB950]" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#3FB950] to-[#58A6FF] mb-4 text-center z-10 text-glow">
            Merge Request Accepted
          </h2>
          <div className="text-[#3FB950] font-mono text-lg sm:text-xl mb-12 flex items-center gap-2">
            <Check className="w-5 h-5" /> git merge origin/love
          </div>
          
          <div className="flex items-center gap-6 mb-12 z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#58A6FF] overflow-hidden shadow-[0_0_30px_rgba(88,166,255,0.4)]">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="you" /> : <div className="w-full h-full bg-[#161B22] flex items-center justify-center"><User className="w-12 h-12 text-[#58A6FF]" /></div>}
            </div>
            <div className="text-gray-500 text-3xl font-mono">===</div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#3FB950] overflow-hidden shadow-[0_0_30px_rgba(63,185,80,0.4)]">
              {matchModal.avatar ? <img src={matchModal.avatar} className="w-full h-full object-cover" alt="match" /> : <div className="w-full h-full bg-[#161B22] flex items-center justify-center"><User className="w-12 h-12 text-[#3FB950]" /></div>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto relative z-10">
            <Button variant="ghost" onClick={() => { setMatchModal(null); }} className="w-full sm:w-auto">Keep Swiping</Button>
            <Button variant="primary" onClick={() => { setMatchModal(null); window.location.href='/chat'; }} className="w-full sm:w-auto">Send Message _</Button>
          </div>
        </div>
      )}

      {/* Idea and Signal Modals */}
      <Modal open={showIdeaModal} onClose={() => setShowIdeaModal(false)} title="Post an Idea">
        <form onSubmit={handlePostIdea} className="space-y-4">
          <div><label className="block text-sm font-mono text-[#58A6FF] mb-1">Title</label><input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)} required /></div>
          <div><label className="block text-sm font-mono text-[#58A6FF] mb-1">Pitch</label><textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white" rows={3} value={ideaPitch} onChange={e => setIdeaPitch(e.target.value)} required /></div>
          <div><label className="block text-sm font-mono text-[#58A6FF] mb-1">Roles Needed</label><input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white" value={ideaRoles} onChange={e => setIdeaRoles(e.target.value)} required /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={() => setShowIdeaModal(false)}>Cancel</Button><Button variant="primary" type="submit">Post Idea</Button></div>
        </form>
      </Modal>

      <Modal open={showSignalModal} onClose={() => setShowSignalModal(false)} title="Broadcast Signal">
        <form onSubmit={handlePostSignal} className="space-y-4">
          <div><label className="block text-sm font-mono text-[#58A6FF] mb-1">Message</label><textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white" rows={3} value={signalMessage} onChange={e => setSignalMessage(e.target.value)} required /></div>
          <div><label className="block text-sm font-mono text-[#58A6FF] mb-1">Role Needed</label><input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white" value={signalRole} onChange={e => setSignalRole(e.target.value)} required /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={() => setShowSignalModal(false)}>Cancel</Button><Button variant="primary" type="submit">Broadcast</Button></div>
        </form>
      </Modal>
    </div>
  );
}
