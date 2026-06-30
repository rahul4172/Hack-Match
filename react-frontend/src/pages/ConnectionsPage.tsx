import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Users, Plus, LogIn, Copy, X, Trash2, LogOut, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createData, setCreateData] = useState({ name: '', hackathon_name: '' });
  const [joinCode, setJoinCode] = useState('');
  const [createdSquad, setCreatedSquad] = useState<any>(null);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/connections');
      setPending(data.pending);
      setAccepted(data.accepted);
      const nearbyData = await fetchAPI('/users/nearby');
      setNearby(nearbyData);
      const squadsData = await fetchAPI('/squads');
      setSquads(squadsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  const handleAccept = async (senderId: string) => {
    try {
      await fetchAPI('/connections/accept', { method: 'POST', body: JSON.stringify({ senderId }) });
      loadConnections();
    } catch {
      alert('Failed to accept');
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetchAPI('/squads', { method: 'POST', body: JSON.stringify(createData) });
      setCreatedSquad(response);
      setCreateData({ name: '', hackathon_name: '' });
      loadConnections();
    } catch (err) {
      console.error(err);
      alert('Failed to create squad');
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    try {
      const response = await fetchAPI('/squads/join', { method: 'POST', body: JSON.stringify({ join_code: joinCode }) });
      setShowJoinModal(false);
      setJoinCode('');
      loadConnections();
      alert('Successfully joined squad!');
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to join squad');
    }
  };

  const handleRenameSquad = async (squadId: string, currentName: string) => {
    const newName = prompt('Enter new squad name:', currentName);
    if (!newName || newName === currentName) return;
    try {
      await fetchAPI(`/squads/${squadId}/rename`, { method: 'PUT', body: JSON.stringify({ name: newName }) });
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to rename squad');
    }
  };

  const handleLeaveSquad = async (squadId: string) => {
    if (!confirm('Are you sure you want to leave this squad?')) return;
    try {
      await fetchAPI(`/squads/${squadId}/leave`, { method: 'POST' });
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to leave squad');
    }
  };

  const handleDisbandSquad = async (squadId: string) => {
    if (!confirm('Are you sure you want to disband this squad? This action cannot be undone.')) return;
    try {
      await fetchAPI(`/squads/${squadId}`, { method: 'DELETE' });
      loadConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to disband squad');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Join code copied to clipboard!');
  };

  if (!user) return <div className="p-8 text-center mt-16 text-[#8B949E]">Please sign in.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <PageHeader title="Network & Squads" subtitle="Manage your hackathon squads and connections" />

      {loading ? (
        <div className="text-[#8B949E] font-mono text-sm animate-pulse">Loading data stream...</div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          
          {/* SQUADS SECTION */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
                <Users className="w-5 h-5 text-purple-400" />
                Hackathon Squads
                <span className="bg-purple-500/10 text-purple-400 text-xs py-0.5 px-2 rounded-full border border-purple-500/30">{squads.length}</span>
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowJoinModal(true)}>
                  <LogIn className="w-4 h-4 mr-2" /> Join Squad
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create Squad
                </Button>
              </div>
            </div>

            {squads.length === 0 ? (
              <p className="text-[#8B949E] text-sm">You haven't joined any hackathon squads yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squads.map((squad, i) => (
                  <GlowCard key={squad.id} variant="purple" delay={i * 0.1}>
                    <div className="p-5 flex flex-col h-full gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-white">{squad.name}</h3>
                          <p className="text-xs text-purple-400 font-mono mt-1">Hackathon: {squad.hackathon_name}</p>
                        </div>
                        <div 
                          className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-black/60 transition-colors"
                          onClick={() => copyToClipboard(squad.join_code)}
                          title="Copy Join Code"
                        >
                          <span className="text-xs font-mono font-bold tracking-widest text-[#58A6FF]">{squad.join_code}</span>
                          <Copy className="w-3 h-3 text-[#8B949E]" />
                        </div>
                      </div>
                      
                      {/* SQUAD ACTIONS */}
                      <div className="flex gap-2 justify-end -mt-2">
                        {squad.creator_id === user?.id ? (
                          <>
                            <button onClick={() => handleRenameSquad(squad.id, squad.name)} className="text-[#8B949E] hover:text-white transition-colors" title="Rename Squad">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDisbandSquad(squad.id)} className="text-[#8B949E] hover:text-red-400 transition-colors" title="Disband Squad">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleLeaveSquad(squad.id)} className="text-[#8B949E] hover:text-red-400 transition-colors" title="Leave Squad">
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="mt-auto">
                        <p className="text-xs text-[#8B949E] mb-2 font-mono">Members ({squad.members?.length || 0})</p>
                        <div className="flex flex-wrap gap-2">
                          {squad.members?.map((member: any) => (
                            <div key={member.id || member._id} className="flex items-center gap-2 bg-[#161B22] border border-white/10 rounded-full pr-3 pl-1 py-1">
                              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center overflow-hidden shrink-0">
                                {member.avatar ? <img src={member.avatar} alt="avatar" className="w-full h-full object-cover"/> : <User className="w-3 h-3 text-white/50" />}
                              </div>
                              <span className="text-xs text-white truncate max-w-[80px]">{member.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </section>

          {/* PENDING CONNECTIONS */}
          <section>
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-[#BC8CFF]">
              Pending Requests
              <span className="bg-[#BC8CFF]/10 text-[#BC8CFF] text-xs py-0.5 px-2 rounded-full border border-[#BC8CFF]/30">{pending.length}</span>
            </h2>
            {pending.length === 0 ? (
              <p className="text-[#8B949E] text-sm">No pending requests.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {pending.map((req, i) => (
                  <GlowCard key={req.id} variant="purple" delay={i * 0.05}>
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{req.name}</h4>
                        <p className="text-xs text-[#58A6FF] font-mono truncate">{req.role}</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => handleAccept(req.sender_id)} className="shrink-0">Accept _</Button>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </section>

          {/* MY CONNECTIONS */}
          <section>
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-[#58A6FF]">
              My Connections
              <span className="bg-[#58A6FF]/10 text-[#58A6FF] text-xs py-0.5 px-2 rounded-full border border-[#58A6FF]/30">{accepted.length}</span>
            </h2>
            {accepted.length === 0 ? (
              <p className="text-[#8B949E] text-sm">No connections yet — head to Discover to find teammates.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {accepted.map((conn, i) => (
                  <GlowCard key={conn.id} variant="cyan" delay={i * 0.05}>
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{conn.name}</h4>
                        <p className="text-xs text-[#8B949E] font-mono truncate">{conn.role}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/chat', { state: { targetUser: conn } })} className="shrink-0">Message</Button>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </section>

          {/* NEARBY DEVELOPERS */}
          <section>
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-[#3FB950]">
              Nearby Developers
              <span className="bg-[#3FB950]/10 text-[#3FB950] text-xs py-0.5 px-2 rounded-full border border-[#3FB950]/30">{nearby.length}</span>
            </h2>
            {nearby.length === 0 ? (
              <p className="text-[#8B949E] text-sm">No developers found nearby.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearby.map((dev, i) => (
                  <GlowCard key={dev.id} variant="green" delay={i * 0.06}>
                    <div className="p-5 flex flex-col items-center text-center h-full">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 border-2 border-[#3FB950]/40 overflow-hidden bg-[#161B22] flex items-center justify-center text-[#58A6FF]">
                        {dev.avatar ? <img src={dev.avatar} alt={dev.name} className="w-full h-full object-cover" /> : <User className="w-8 h-8" />}
                      </div>
                      <h4 className="font-bold text-white mb-1">{dev.name}</h4>
                      <p className="text-xs text-[#3FB950] font-mono mb-2">{dev.role}</p>
                      <p className="text-xs text-[#8B949E] mb-3 line-clamp-2 flex-1">{dev.bio}</p>
                      <div className="text-[10px] text-[#8B949E] font-mono bg-black/40 px-2 py-1 rounded-lg mb-4 w-full truncate flex items-center gap-1"><MapPin className="w-3 h-3" /> {dev.location}</div>
                      <Button variant="primary" className="w-full text-sm mt-auto" onClick={async () => {
                        try {
                          await fetchAPI('/connections/request', { method: 'POST', body: JSON.stringify({ receiverId: dev.id }) });
                          alert('Connection request sent!');
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : 'Error sending request');
                        }
                      }}>
                        Connect +
                      </Button>
                    </div>
                  </GlowCard>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* CREATE SQUAD MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
              {createdSquad ? (
                <div className="text-center">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Squad Created! 🎉</h2>
                    <button onClick={() => { setShowCreateModal(false); setCreatedSquad(null); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">Share this code with your teammates to let them join <strong className="text-white">{createdSquad.name}</strong>.</p>
                  
                  <div className="bg-[#0D1117] border border-white/10 rounded-lg p-6 mb-6">
                    <span className="text-4xl font-mono font-bold tracking-widest text-[#58A6FF]">{createdSquad.join_code}</span>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="w-full" onClick={() => { setShowCreateModal(false); setCreatedSquad(null); }}>Close</Button>
                    <Button variant="primary" className="w-full flex items-center justify-center gap-2" onClick={() => copyToClipboard(createdSquad.join_code)}>
                      <Copy className="w-4 h-4" /> Copy Code
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Create Squad</h2>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                  <form className="space-y-4" onSubmit={handleCreateSquad}>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Squad Name</label>
                      <input required type="text" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]" placeholder="e.g. The Try Catchers" />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Target Hackathon</label>
                      <input required type="text" value={createData.hackathon_name} onChange={e => setCreateData({...createData, hackathon_name: e.target.value})} className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]" placeholder="e.g. ISRO Hackathon" />
                    </div>
                    <Button variant="primary" type="submit" className="w-full mt-4" disabled={!createData.name || !createData.hackathon_name}>Create & Get Code</Button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* JOIN SQUAD MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Join Squad</h2>
                <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form className="space-y-4" onSubmit={handleJoinSquad}>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">6-Character Join Code</label>
                  <input required type="text" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-[#58A6FF]" placeholder="e.g. XJ9K1M" />
                </div>
                <Button variant="primary" type="submit" className="w-full mt-4" disabled={!joinCode}>Join Squad</Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
