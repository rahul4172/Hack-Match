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

  const getHackScoreBadge = (score: number = 0) => {
    if (score >= 850) return { label: 'Legend', color: 'text-yellow-300 border-yellow-300/50 bg-yellow-300/10' };
    if (score >= 600) return { label: 'Veteran', color: 'text-purple-400 border-purple-400/50 bg-purple-400/10' };
    if (score >= 300) return { label: 'Builder', color: 'text-blue-400 border-blue-400/50 bg-blue-400/10' };
    return { label: 'Spark', color: 'text-gray-400 border-gray-400/50 bg-gray-400/10' };
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
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Discover Squad Members
        </h1>
        <div className="flex gap-4">
          <Button onClick={() => setShowIdeaModal(true)} variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20">
            💡 Post an Idea
          </Button>
          <Button onClick={() => setShowSignalModal(true)} className="bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/40">
            🚨 Broadcast Team Signal
          </Button>
        </div>
      </div>

      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Post an Idea</h2>
            <p className="text-gray-400 text-sm mb-4">Reverse the search: post your vision and let the right people find you.</p>
            <form onSubmit={handlePostIdea}>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Title</label>
                <input 
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  value={ideaTitle}
                  onChange={e => setIdeaTitle(e.target.value)}
                  placeholder="e.g. AI Code Reviewer"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Pitch</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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

      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Broadcast Signal</h2>
            <p className="text-gray-400 text-sm mb-4">Need someone urgently? Send a platform-wide alert. Expires in 6 hours.</p>
            <form onSubmit={handlePostSignal}>
              <div className="mb-4">
                <label className="block text-sm font-mono text-cyan-400 mb-1">Message</label>
                <textarea 
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
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

      {signals.length > 0 && !loading && (
        <div className="mb-8 space-y-4">
          {signals.map(s => {
            const requested = sentRequests.has(s.user_id);
            return (
              <div key={s.id} className="bg-red-900/10 border border-red-500/30 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-400 font-bold flex items-center gap-2 animate-pulse">🚨 ACTIVE SIGNAL</span>
                  <span className="text-xs text-red-400/60 font-mono">Expires {new Date(s.expires_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-gray-200 mb-2 text-lg">"{s.message}"</p>
                <p className="text-sm font-mono text-cyan-400 mb-4">Looking for: {s.role_needed}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">Broadcast by <span className="text-white font-bold">{s.name}</span></div>
                  {s.user_id !== user.id && (
                    <Button variant={requested ? "ghost" : "primary"} onClick={() => handleConnect(s.user_id)} disabled={requested}>
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
            <div className="relative w-[90vw] sm:max-w-md h-[70vh] sm:h-[600px]">
              {(() => {
                const item = users[currentIndex] as any;
                const isIdea = item.type === 'idea';
                const u = isIdea ? item : item;

                let skills: string[] = [];
                try { skills = JSON.parse(u.skills || '[]'); } catch (e) {}

                // Mock dynamic data for realistic feel
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
                    
                    {/* Header Image Area Mock */}
                    <div className="h-32 bg-gradient-to-br from-[#161B22] to-[#0D1117] flex items-center justify-center border-b border-white/5 relative">
                       {swipeAnim === 'right' && <div className="absolute inset-0 flex items-center justify-center bg-[#3FB950]/80 z-10"><span className="text-white font-mono font-bold text-xl border-4 border-white p-2 transform -rotate-12">git merge successful</span></div>}
                       {swipeAnim === 'left' && <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 z-10"><span className="text-white font-mono font-bold text-xl border-4 border-white p-2 transform rotate-12">git reset --hard</span></div>}
                       {swipeAnim === 'up' && <div className="absolute inset-0 flex items-center justify-center bg-[#BC8CFF]/80 z-10"><span className="text-white font-mono font-bold text-xl border-4 border-white p-2">sudo approve-user</span></div>}
                       
                       <div className="absolute -bottom-10 left-6 w-20 h-20 bg-gray-800 rounded-full border-4 border-[#161B22] overflow-hidden flex items-center justify-center">
                         <span className="text-3xl">💻</span>
                       </div>
                    </div>

                    <div className="p-6 pt-12 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          {isIdea ? `💡 IDEA: ${u.title}` : `${u.name}, ${randomAge}`}
                        </h3>
                      </div>
                      
                      <p className="text-sm font-mono text-[#58A6FF] mb-4">
                        {isIdea ? `By ${u.creator_name}` : u.role} @ HackMatch Network
                      </p>

                      {!isIdea && (
                        <div className="flex gap-4 font-mono text-xs mb-4 text-[#C9D1D9]">
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">⭐ {stars}</span> Stars</div>
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">📦 {repos}</span> Repos</div>
                          <div className="flex flex-col items-center"><span className="font-bold text-white text-base">🔥 {streak}</span> Streak</div>
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
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Looking For</h4>
                          <ul className="text-sm text-[#C9D1D9] space-y-1">
                            <li className="flex items-center"><span className="text-[#3FB950] mr-2">✔</span> Hackathon Partner</li>
                            <li className="flex items-center"><span className="text-[#3FB950] mr-2">✔</span> Open Source Buddy</li>
                          </ul>
                        </div>
                      )}

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
                  className="w-16 h-16 rounded-full bg-[#161B22] border-2 border-red-500/50 text-red-500 flex items-center justify-center text-3xl hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/20"
                >
                  ✕
                </button>
                <button 
                  onClick={() => {
                    setSwipeAnim('up');
                    setTimeout(() => { 
                      setSwipeAnim(null); 
                      handleConnect(users[currentIndex].id);
                      setMatchModal(users[currentIndex]); // Trigger match
                    }, 500);
                  }}
                  className="w-14 h-14 rounded-full bg-[#161B22] border-2 border-[#BC8CFF]/50 text-[#BC8CFF] flex items-center justify-center text-2xl hover:bg-[#BC8CFF]/20 transition-all shadow-lg shadow-[#BC8CFF]/20 transform -translate-y-4"
                >
                  ⭐
                </button>
                <button 
                  onClick={() => {
                    setSwipeAnim('right');
                    setTimeout(() => { 
                      setSwipeAnim(null); 
                      handleConnect(users[currentIndex].id);
                      // 30% chance to match
                      if (Math.random() > 0.7) setMatchModal(users[currentIndex]);
                      else setCurrentIndex(curr => curr + 1);
                    }, 500);
                  }}
                  className="w-16 h-16 rounded-full bg-[#161B22] border-2 border-[#3FB950]/50 text-[#3FB950] flex items-center justify-center text-3xl hover:bg-[#3FB950]/20 transition-all shadow-lg shadow-[#3FB950]/20"
                >
                  ❤️
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 glass rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">No more developers nearby.</h2>
              <p className="text-gray-400 font-mono">Expand your search criteria or try again later.</p>
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
              <div key={`${isIdea ? 'idea' : 'user'}-${u.id}`} className="ultra-glass rounded-2xl p-6 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(88,166,255,0.2)] group cursor-pointer relative overflow-hidden">
                {/* Desktop Neon Hover Border Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl border-2 border-transparent" style={{ background: 'linear-gradient(45deg, #58A6FF, #BC8CFF) border-box', WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'destination-out', maskComposite: 'exclude' }} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {isIdea ? `💡 IDEA: ${u.title}` : u.name}
                    </h3>
                    <p className="text-sm font-mono text-[#58A6FF] mt-1">{isIdea ? `By ${u.creator_name}` : u.role}</p>
                  </div>
                  {!isIdea && u.synergy_score !== undefined && (
                    <div className="text-xs px-2 py-1 rounded border border-[#3FB950]/50 bg-[#3FB950]/10 text-[#3FB950] font-mono font-bold shadow-[0_0_10px_rgba(63,185,80,0.3)]">
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
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#3FB950] to-[#58A6FF] mb-4">
            Merge Request Accepted ❤️
          </h2>
          <div className="text-[#3FB950] font-mono text-xl mb-8 typing-effect">
            git merge origin/love
          </div>
          
          <div className="flex gap-8 mb-12">
            <div className="w-32 h-32 rounded-full border-4 border-[#58A6FF] border-t-transparent animate-spin flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <span className="animate-none text-[#58A6FF] font-bold text-xl absolute">95%</span>
              <div className="absolute -bottom-8 text-xs font-mono text-gray-400 text-center w-full">React Match</div>
            </div>
            <div className="w-32 h-32 rounded-full border-4 border-[#BC8CFF] border-b-transparent animate-spin flex items-center justify-center relative" style={{animationDirection: 'reverse'}}>
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <span className="animate-none text-[#BC8CFF] font-bold text-xl absolute" style={{animationDirection: 'reverse'}}>88%</span>
              <div className="absolute -bottom-8 text-xs font-mono text-gray-400 text-center w-full">Overall Match</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => { setMatchModal(null); setCurrentIndex(c => c+1); }}>Keep Swiping</Button>
            <Button variant="primary" onClick={() => { setMatchModal(null); window.location.href='/chat'; }}>Send Message _</Button>
          </div>
        </div>
      )}
    </div>
  );
}
