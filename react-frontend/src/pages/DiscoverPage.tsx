import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import type { UserProfile } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';


export default function DiscoverPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<'left' | 'right' | 'up' | null>(null);
  const [matchModal, setMatchModal] = useState<any>(null);
  
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalMessage, setSignalMessage] = useState('');
  const [signalRole, setSignalRole] = useState('');

  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaPitch, setIdeaPitch] = useState('');
  const [ideaRoles, setIdeaRoles] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, signalsData] = await Promise.all([
          fetchAPI('/users'),
          fetchAPI('/signals/active')
        ]);
        setUsers(usersData);
        setSignals(signalsData);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadData();
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
      setSentRequests(prev => new Set(prev).add(receiverId));
    } catch (err) {
      alert("Could not send request. Maybe already sent.");
    }
  };

  if (!user) return <div className="p-8 text-center mt-16 text-gray-500">Please sign in to discover developers.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Discover Squad Members
        </h1>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <Button onClick={() => setShowIdeaModal(true)} variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20 text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-none">
            💡 Post Idea
          </Button>
          <Button onClick={() => setShowSignalModal(true)} className="bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/40 text-xs sm:text-sm px-2 sm:px-4 flex-1 sm:flex-none">
            🚨 Broadcast Signal
          </Button>
        </div>
      </div>

      {/* Idea Modal */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 p-5 sm:p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Post an Idea</h2>
            <p className="text-gray-400 text-sm mb-4">Reverse the search: post your vision and let the right people find you.</p>
            <form onSubmit={handlePostIdea}>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Title</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  value={ideaTitle}
                  onChange={e => setIdeaTitle(e.target.value)}
                  placeholder="e.g. AI Code Reviewer"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Pitch</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  rows={3}
                  value={ideaPitch}
                  onChange={e => setIdeaPitch(e.target.value)}
                  placeholder="One-liner about what you're building"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Roles Needed</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  value={ideaRoles}
                  onChange={e => setIdeaRoles(e.target.value)}
                  placeholder="e.g. Full Stack + UI Designer"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setShowIdeaModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Post Idea</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signal Modal */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 p-5 sm:p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Broadcast Signal</h2>
            <p className="text-gray-400 text-sm mb-4">Need someone urgently? Send a platform-wide alert. Expires in 6 hours.</p>
            <form onSubmit={handlePostSignal}>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Message</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  rows={3}
                  value={signalMessage}
                  onChange={e => setSignalMessage(e.target.value)}
                  placeholder="e.g. Need a React dev to finish our frontend tonight!"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Role Needed</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-sm"
                  value={signalRole}
                  onChange={e => setSignalRole(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setShowSignalModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Broadcast</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Signals */}
      {signals.length > 0 && !loading && (
        <div className="mb-6 sm:mb-8 space-y-4">
          {signals.map(s => {
            const requested = sentRequests.has(s.user_id);
            return (
              <div key={s.id} className="bg-red-900/10 border border-red-500/30 p-4 sm:p-5 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                  <span className="text-red-400 font-bold flex items-center gap-2 animate-pulse text-sm">🚨 ACTIVE SIGNAL</span>
                  <span className="text-xs text-red-400/60 font-mono">Expires {new Date(s.expires_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-200 mb-2 text-base sm:text-lg">"{s.message}"</p>
                <p className="text-sm font-mono text-cyan-400 mb-4">Looking for: {s.role_needed}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-gray-400">Broadcast by <span className="text-white font-bold">{s.name}</span></div>
                  {s.user_id !== user.id && (
                    <Button variant={requested ? "ghost" : "primary"} onClick={() => handleConnect(s.user_id)} disabled={requested} className="w-full sm:w-auto">
                      {requested ? 'Request Sent' : 'Connect to Help _'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-[#58A6FF] animate-pulse font-mono flex justify-center text-xl mt-12">Scanning network...</div>
      ) : (
        <>
        {/* MOBILE VIEW (Swipe Stack) */}
        <div className="flex flex-col items-center justify-center mt-8 md:hidden h-[75vh]">
          {currentIndex < users.length ? (
            <div className="relative w-[92vw] sm:max-w-md h-[68vh] sm:h-[600px]">
              {(() => {
                const item = users[currentIndex] as any;
                const isIdea = item.type === 'idea';
                const u = isIdea ? item : item;

                let skills: string[] = [];
                try { skills = JSON.parse(u.skills || '[]'); } catch (e) {}

                const randomAge = Math.floor(Math.random() * 5) + 18;
                const stars = Math.floor(Math.random() * 300) + 10;
                const repos = Math.floor(Math.random() * 50) + 5;
                const streak = Math.floor(Math.random() * 100);
                
                return (
                  <div className={`absolute inset-0 w-full h-full ultra-glass rounded-3xl flex flex-col overflow-hidden transition-transform duration-500
                    ${swipeAnim === 'left' ? '-translate-x-[150%] rotate-[-20deg] opacity-0' : ''}
                    ${swipeAnim === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : ''}
                    ${swipeAnim === 'up' ? '-translate-y-[150%] opacity-0' : ''}
                  `}>
                    
                    <div className="h-28 sm:h-32 bg-gradient-to-br from-[#161B22] via-[#0D1117] to-[#1F6FEB]/10 flex items-center justify-center border-b border-white/10 relative shrink-0 overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                       {swipeAnim === 'right' && <div className="absolute inset-0 flex items-center justify-center bg-[#3FB950]/80 backdrop-blur-sm z-10 transition-all duration-300"><span className="text-white font-mono font-bold text-lg border-4 border-white p-2 transform -rotate-12 shadow-[0_0_20px_rgba(255,255,255,0.5)]">git merge successful</span></div>}
                       {swipeAnim === 'left' && <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm z-10 transition-all duration-300"><span className="text-white font-mono font-bold text-lg border-4 border-white p-2 transform rotate-12 shadow-[0_0_20px_rgba(255,255,255,0.5)]">git reset --hard</span></div>}
                       {swipeAnim === 'up' && <div className="absolute inset-0 flex items-center justify-center bg-[#BC8CFF]/80 backdrop-blur-sm z-10 transition-all duration-300"><span className="text-white font-mono font-bold text-lg border-4 border-white p-2 shadow-[0_0_20px_rgba(255,255,255,0.5)]">sudo approve-user</span></div>}
                       
                       <div className="absolute -bottom-10 left-6 w-20 h-20 bg-gray-900 rounded-full border-4 border-[#58A6FF]/30 shadow-[0_0_20px_rgba(88,166,255,0.3)] overflow-hidden flex items-center justify-center z-20">
                         <span className="text-3xl text-glow">💻</span>
                       </div>
                    </div>

                    <div className="p-5 pt-12 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 pr-2">
                          {isIdea ? `💡 IDEA: ${u.title}` : `${u.name}, ${randomAge}`}
                        </h3>
                      </div>
                      
                      <p className="text-sm font-mono text-[#58A6FF] mb-4">
                        {isIdea ? `By ${u.creator_name}` : u.role} @ HackMatch Network
                      </p>

                      {!isIdea && (
                        <div className="flex gap-4 font-mono text-xs mb-4 text-[#C9D1D9]">
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">⭐ {stars}</span>Stars</div>
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">📦 {repos}</span>Repos</div>
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">🔥 {streak}</span>Streak</div>
                        </div>
                      )}

                      <p className="text-[#C9D1D9] text-sm mb-4 leading-relaxed">
                        {isIdea ? `"${u.pitch}"` : u.bio}
                      </p>

                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.map(s => (
                            <span key={s} className="px-3 py-1 text-xs font-bold bg-[#161B22] text-[#C9D1D9] rounded-full border border-white/10 shadow-sm">
                              {s}
                            </span>
                          ))}
                          {isIdea && <span className="px-3 py-1 text-xs font-bold bg-[#161B22] text-[#C9D1D9] rounded-full border border-white/10 shadow-sm">{u.roles_needed}</span>}
                        </div>
                      </div>

                      {!isIdea && (
                        <div className="mb-4 bg-black/40 p-3 rounded-lg">
                          <h4 className="text-[10px] font-mono text-[#BC8CFF] uppercase tracking-wider mb-2">System Config</h4>
                          <div className="flex flex-wrap gap-2 text-xs font-mono text-[#C9D1D9]">
                            <span className="bg-black px-2 py-1 rounded">Tabs {'>'} Spaces</span>
                            <span className="bg-black px-2 py-1 rounded">Coffee {'>'} Tea</span>
                            <span className="bg-black px-2 py-1 rounded">Linux</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="absolute -bottom-20 left-0 w-full flex justify-center gap-6 items-center">
                <button 
                  onClick={() => {
                    setSwipeAnim('left');
                    setTimeout(() => { setSwipeAnim(null); setCurrentIndex(curr => curr + 1); }, 500);
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#161B22] border-2 border-red-500/50 text-red-500 flex items-center justify-center text-2xl sm:text-3xl hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/20"
                >
                  ✕
                </button>
                <button 
                  onClick={() => {
                    setSwipeAnim('up');
                    setTimeout(() => { 
                      setSwipeAnim(null); 
                      handleConnect(users[currentIndex].id);
                      setMatchModal(users[currentIndex]);
                    }, 500);
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#161B22] border-2 border-[#BC8CFF]/50 text-[#BC8CFF] flex items-center justify-center text-xl sm:text-2xl hover:bg-[#BC8CFF]/20 transition-all shadow-lg shadow-[#BC8CFF]/20 transform -translate-y-4"
                >
                  ⭐
                </button>
                <button 
                  onClick={() => {
                    setSwipeAnim('right');
                    setTimeout(() => { 
                      setSwipeAnim(null); 
                      handleConnect(users[currentIndex].id);
                      if (Math.random() > 0.7) setMatchModal(users[currentIndex]);
                      else setCurrentIndex(curr => curr + 1);
                    }, 500);
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#161B22] border-2 border-[#3FB950]/50 text-[#3FB950] flex items-center justify-center text-2xl sm:text-3xl hover:bg-[#3FB950]/20 transition-all shadow-lg shadow-[#3FB950]/20"
                >
                  ❤️
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-10 glass rounded-2xl mx-4">
              <h2 className="text-xl font-bold text-white mb-2">No more developers nearby.</h2>
              <p className="text-gray-400 font-mono text-sm">Expand your search criteria or try again later.</p>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (Premium Grid) */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {users.map((item: any) => {
            const isIdea = item.type === 'idea';
            const u = item;
            let skills: string[] = [];
            try { skills = JSON.parse(u.skills || '[]'); } catch (e) {}

            const requested = sentRequests.has(isIdea ? u.creator_id : u.id);

            return (
              <div key={`${isIdea ? 'idea' : 'user'}-${u.id}`} className="ultra-glass rounded-3xl p-6 flex flex-col h-full transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(88,166,255,0.15)] group cursor-pointer relative overflow-hidden border border-white/5 hover:border-white/20">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl border-2 border-transparent" style={{ background: 'linear-gradient(45deg, rgba(88,166,255,0.5), rgba(188,140,255,0.5)) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'destination-out', maskComposite: 'exclude' }} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {isIdea ? `💡 IDEA: ${u.title}` : u.name}
                    </h3>
                    <p className="text-sm font-mono text-[#58A6FF] mt-1">{isIdea ? `By ${u.creator_name}` : u.role}</p>
                  </div>
                  {!isIdea && u.synergy_score !== undefined && (
                    <div className="text-xs px-2 py-1 rounded border border-[#3FB950]/50 bg-[#3FB950]/10 text-[#3FB950] font-mono font-bold shadow-[0_0_10px_rgba(63,185,80,0.3)] shrink-0">
                      {u.synergy_score}% Match
                    </div>
                  )}
                </div>

                <p className="text-[#C9D1D9] text-sm mb-6 flex-1 relative z-10">{isIdea ? `"${u.pitch}"` : u.bio}</p>

                <div className="mb-6 relative z-10">
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 4).map(s => (
                      <span key={s} className="px-2 py-1 text-xs font-mono bg-[#010409] text-[#C9D1D9] rounded border border-white/5">
                        {s}
                      </span>
                    ))}
                    {isIdea && <span className="px-2 py-1 text-xs font-mono bg-[#1F6FEB]/20 text-[#58A6FF] rounded border border-[#58A6FF]/20">{u.roles_needed}</span>}
                  </div>
                </div>

                <Button 
                  className="w-full relative z-10 font-bold tracking-widest text-sm py-3" 
                  variant={requested ? "ghost" : "primary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnect(isIdea ? u.creator_id : u.id);
                  }}
                  disabled={requested}
                >
                  {requested ? 'Request Sent' : (isIdea ? 'Connect on Idea _' : 'Initiate Connect _')}
                </Button>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* Match Modal */}
      {matchModal && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in zoom-in duration-500">
          <div className="absolute inset-0 aurora-bg opacity-30"></div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#3FB950] to-[#58A6FF] mb-4 text-center z-10 text-glow">
            Merge Request Accepted ❤️
          </h2>
          <div className="text-[#3FB950] font-mono text-base sm:text-xl mb-8">
            git merge origin/love
          </div>
          
          <div className="flex gap-6 sm:gap-8 mb-12">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#58A6FF] border-t-transparent animate-spin flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <span className="animate-none text-[#58A6FF] font-bold text-lg sm:text-xl absolute">95%</span>
              <div className="absolute -bottom-8 text-xs font-mono text-gray-400 text-center w-full">React Match</div>
            </div>
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#BC8CFF] border-b-transparent animate-spin flex items-center justify-center relative" style={{animationDirection: 'reverse'}}>
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <span className="animate-none text-[#BC8CFF] font-bold text-lg sm:text-xl absolute" style={{animationDirection: 'reverse'}}>88%</span>
              <div className="absolute -bottom-8 text-xs font-mono text-gray-400 text-center w-full">Overall Match</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none sm:w-auto">
            <Button variant="ghost" onClick={() => { setMatchModal(null); setCurrentIndex(c => c+1); }} className="w-full sm:w-auto">Keep Swiping</Button>
            <Button variant="primary" onClick={() => { setMatchModal(null); window.location.href='/chat'; }} className="w-full sm:w-auto">Send Message _</Button>
          </div>
        </div>
      )}
    </div>
  );
}
