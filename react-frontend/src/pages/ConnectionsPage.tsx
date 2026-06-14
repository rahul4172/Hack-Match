import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

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
      await fetchAPI('/connections/accept', {
        method: 'POST',
        body: JSON.stringify({ senderId })
      });
      loadConnections(); // Refresh lists
    } catch (err) {
      alert("Failed to accept");
    }
  };

  if (!user) return <div className="p-8 text-center mt-16">Please sign in.</div>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-cyan-400">Network & Connections</h1>

      {loading ? (
        <div className="text-gray-500 font-mono">Loading data stream...</div>
      ) : (
        <div className="space-y-12">
          {/* Pending Requests */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-400">Pending Requests</span>
              <span className="bg-purple-900/50 text-purple-300 text-xs py-1 px-2 rounded-full">{pending.length}</span>
            </h2>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No pending requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map(req => (
                  <div key={req.id} className="glass p-4 rounded-xl flex items-center justify-between border border-purple-500/20">
                    <div>
                      <h4 className="font-bold text-white">{req.name}</h4>
                      <p className="text-xs text-cyan-400 font-mono">{req.role}</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => handleAccept(req.sender_id)}>Accept _</Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Accepted Connections */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-cyan-400">My Squad</span>
              <span className="bg-cyan-900/50 text-cyan-300 text-xs py-1 px-2 rounded-full">{accepted.length}</span>
            </h2>
            {accepted.length === 0 ? (
              <p className="text-gray-500 text-sm italic">You haven't connected with anyone yet. Go to Discover to find teammates.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accepted.map(conn => (
                  <div key={conn.id} className="glass p-4 rounded-xl flex items-center justify-between border border-cyan-500/20 hover:border-cyan-500/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{conn.name}</h4>
                      <p className="text-xs text-gray-400 font-mono">{conn.role}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/chat', { state: { targetUser: conn } })}>
                      Message
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Nearby Developers */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-green-400">Nearby Developers</span>
              <span className="bg-green-900/50 text-green-300 text-xs py-1 px-2 rounded-full">{nearby.length}</span>
            </h2>
            {nearby.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No developers found in your area.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {nearby.map(dev => (
                  <div key={dev.id} className="glass p-5 rounded-xl flex flex-col items-center text-center border border-green-500/20 hover:border-green-500/50 transition-all shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                    <img src={dev.avatar} alt={dev.name} className="w-16 h-16 rounded-full mb-3 border-2 border-green-500/50" />
                    <h4 className="font-bold text-white mb-1">{dev.name}</h4>
                    <p className="text-xs text-green-400 font-mono mb-2">{dev.role}</p>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{dev.bio}</p>
                    <div className="text-[10px] text-gray-500 font-mono bg-black/50 px-2 py-1 rounded mb-4 w-full truncate">
                      📍 {dev.location}
                    </div>
                    <Button variant="primary" className="w-full mt-auto" onClick={async () => {
                      try {
                        await fetchAPI('/connections/request', { method: 'POST', body: JSON.stringify({ receiverId: dev.id }) });
                        alert('Connection request sent!');
                      } catch (e: any) { alert(e.message || 'Error sending request'); }
                    }}>
                      Connect +
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
