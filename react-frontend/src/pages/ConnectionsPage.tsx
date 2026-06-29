import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { User, MapPin } from 'lucide-react';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConnections = async () => {
    try {
      const data = await fetchAPI('/connections');
      setPending(data.pending);
      setAccepted(data.accepted);
      const nearbyData = await fetchAPI('/users/nearby');
      setNearby(nearbyData);
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

  if (!user) return <div className="p-8 text-center mt-16 text-[#8B949E]">Please sign in.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <PageHeader title="Network & Connections" subtitle="Manage your squad and find nearby devs" />

      {loading ? (
        <div className="text-[#8B949E] font-mono text-sm animate-pulse">Loading data stream...</div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
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

          <section>
            <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-[#58A6FF]">
              My Squad
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
    </div>
  );
}
