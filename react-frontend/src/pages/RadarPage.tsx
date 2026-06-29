import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';

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
      <PageHeader
        title="Hackathon Radar"
        subtitle="Live feed of upcoming events matched to your stack"
        gradient="from-[#58A6FF] to-[#BC8CFF]"
      />

      {loading ? (
        <div className="flex items-center gap-3 text-[#58A6FF] font-mono text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-[#58A6FF]/30 border-t-[#58A6FF] animate-spin" />
          Scanning radar...
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {hackathons.map((h, i) => (
            <GlowCard key={h.id} variant={h.fit_score >= 80 ? 'green' : 'cyan'} delay={i * 0.08}>
              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{h.name}</h3>
                      {h.platform && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-400 font-mono font-bold">
                          {h.platform}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm font-mono text-[#58A6FF] mb-2">
                      <span>📅 {h.date}</span>
                      <span>💰 {h.prize_pool}</span>
                      <span>👥 {h.team_size}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#8B949E]">
                      Stack: <span className="text-white">{h.tech_stack_focus}</span>
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                    <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full border whitespace-nowrap ${
                      h.fit_score >= 80
                        ? 'bg-[#3FB950]/15 text-[#3FB950] border-[#3FB950]/40 glow-border-green'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40'
                    }`}>
                      {h.fit_score}% Fit
                    </span>
                    {h.registration_url ? (
                      <Button variant="primary" onClick={() => window.open(h.registration_url, '_blank')} className="text-sm">
                        Register on {h.platform || 'Website'} ↗
                      </Button>
                    ) : (
                      <Button variant={h.joined ? 'ghost' : 'primary'} onClick={() => handleJoin(h.id)} disabled={h.joined} className="text-sm">
                        {h.joined ? 'Locked _' : "I'm In _"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      )}
    </div>
  );
}
