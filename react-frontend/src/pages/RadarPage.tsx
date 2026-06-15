import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';

export default function RadarPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAPI('/hackathons');
        setHackathons(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleJoin = async (id: string) => {
    try {
      await fetchAPI(`/hackathons/${id}/join`, { method: 'POST' });
      setHackathons(hackathons.map(h => h.id === id ? { ...h, joined: true } : h));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
        Hackathon Radar
      </h1>
      <p className="text-gray-400 mb-6 sm:mb-8 font-mono text-sm">Live feed of upcoming events matched to your stack.</p>

      {loading ? (
         <div className="text-cyan-500 animate-pulse font-mono">Scanning radar...</div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {hackathons.map(h => (
            <div key={h.id} className="glass p-4 sm:p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 leading-tight">{h.name}</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-mono text-cyan-400 mb-2">
                    <span>📅 {h.date}</span>
                    <span>💰 {h.prize_pool}</span>
                    <span>👥 {h.team_size}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">Tech Stack: <span className="text-white">{h.tech_stack_focus}</span></p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4 shrink-0">
                  <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border whitespace-nowrap ${h.fit_score >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}`}>
                    {h.fit_score}% Fit
                  </span>
                  <Button 
                    variant={h.joined ? "ghost" : "primary"}
                    onClick={() => handleJoin(h.id)}
                    disabled={h.joined}
                    className="text-sm shrink-0"
                  >
                    {h.joined ? 'Locked _' : "I'm In _"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
