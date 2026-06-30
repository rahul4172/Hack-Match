import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar, DollarSign, Users, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadarPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    platform: 'Devfolio',
    registration_url: '',
    date: '',
    prize_pool: '',
    tech_stack_focus: '',
    team_size: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newHackathon = await fetchAPI('/hackathons', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Optimistically add to top of list with a default fit_score for UI
      setHackathons([{...newHackathon, fit_score: 95}, ...hackathons]);
      setShowModal(false);
      setFormData({
        name: '', platform: 'Devfolio', registration_url: '', date: '', prize_pool: '', tech_stack_focus: '', team_size: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to submit hackathon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Hackathon Radar"
          subtitle="Live feed of upcoming events matched to your stack"
          gradient="from-[#58A6FF] to-[#BC8CFF]"
        />
        <Button variant="primary" onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Submit Hackathon
        </Button>
      </div>

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
                    <div className="flex flex-col gap-2 text-xs sm:text-sm font-mono text-[#8B949E] mb-2">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#58A6FF]" /> {h.date || 'TBA'}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#3FB950]" /> {h.prize_pool || 'Prizes TBA'}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#BC8CFF]" /> {h.team_size || 'Flexible'}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#8B949E]">
                      Stack: <span className="text-white">{h.tech_stack_focus || 'Open Stack'}</span>
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

      {/* Add Hackathon Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#58A6FF]/5 to-[#BC8CFF]/5 pointer-events-none" />
              
              <div className="relative flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold text-white">Submit Hackathon</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Hackathon Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                    placeholder="e.g. ETHGlobal San Francisco"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Platform</label>
                    <select
                      value={formData.platform}
                      onChange={e => setFormData({...formData, platform: e.target.value})}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                    >
                      <option value="Devfolio">Devfolio</option>
                      <option value="Unstop">Unstop</option>
                      <option value="MLH">MLH</option>
                      <option value="Taikai">Taikai</option>
                      <option value="Devpost">Devpost</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                      placeholder="e.g. Nov 3-5, 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Registration Link *</label>
                  <input
                    required
                    type="url"
                    value={formData.registration_url}
                    onChange={e => setFormData({...formData, registration_url: e.target.value})}
                    className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Prize Pool</label>
                    <input
                      type="text"
                      value={formData.prize_pool}
                      onChange={e => setFormData({...formData, prize_pool: e.target.value})}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                      placeholder="e.g. $10,000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Team Size</label>
                    <input
                      type="text"
                      value={formData.team_size}
                      onChange={e => setFormData({...formData, team_size: e.target.value})}
                      className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                      placeholder="e.g. 1-4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Tech Stack / Focus</label>
                  <input
                    type="text"
                    value={formData.tech_stack_focus}
                    onChange={e => setFormData({...formData, tech_stack_focus: e.target.value})}
                    className="w-full bg-[#0D1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#58A6FF]"
                    placeholder="e.g. Web3, GenAI, React"
                  />
                </div>

                <Button variant="primary" type="submit" disabled={submitting} className="w-full mt-4">
                  {submitting ? 'Submitting...' : 'Submit to Radar _'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
