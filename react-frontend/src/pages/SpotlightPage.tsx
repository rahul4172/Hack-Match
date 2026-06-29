import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';

export default function SpotlightPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', link: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await fetchAPI('/spotlight');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      await fetchAPI('/projects', {
        method: 'POST',
        body: JSON.stringify({ ...formData, tags: JSON.stringify(tagsArray) }),
      });
      setShowForm(false);
      setFormData({ title: '', description: '', link: '', tags: '' });
      loadProjects();
    } catch {
      alert('Failed to add project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <PageHeader
        title="Project Spotlight"
        subtitle="Showcase what you've built"
        gradient="from-yellow-400 via-orange-400 to-[#FF7B72]"
        action={
          user ? (
            <Button variant="primary" onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
              {showForm ? 'Cancel' : 'Share Project _'}
            </Button>
          ) : undefined
        }
      />

      {showForm && (
        <GlowCard variant="orange" tilt={false} className="mb-6 sm:mb-8 max-w-2xl">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold mb-4 text-orange-400">Share Your Latest Build</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(['title', 'link'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm text-[#8B949E] mb-1 capitalize">{field === 'link' ? 'Project Link' : 'Project Title'}</label>
                  <input
                    required
                    value={formData[field]}
                    onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500/50 focus:outline-none text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-[#8B949E] mb-1">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500/50 focus:outline-none h-24 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[#8B949E] mb-1">Tags (comma separated)</label>
                <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="React, AI, Web3..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-orange-500/50 focus:outline-none text-sm" />
              </div>
              <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Sharing...' : 'Share Now'}
              </Button>
            </form>
          </div>
        </GlowCard>
      )}

      {loading ? (
        <div className="text-orange-400 animate-pulse font-mono text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <p className="text-[#8B949E] text-sm">No projects shared yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {projects.map((p, i) => {
            let tags: string[] = [];
            try { tags = JSON.parse(p.tags || '[]'); } catch { /* ignore */ }

            return (
              <GlowCard key={p.id} variant="orange" delay={i * 0.07}>
                <div className="p-5 sm:p-6 flex flex-col h-full min-h-[220px] relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 relative">{p.title}</h3>
                  <p className="text-[#C9D1D9] text-sm mb-4 flex-1 relative line-clamp-3">{p.description}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4 relative">
                      {tags.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs font-mono bg-orange-500/10 text-orange-300 rounded-lg border border-orange-500/20">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5 gap-3 relative">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#58A6FF] to-[#BC8CFF] flex items-center justify-center text-xs font-bold shrink-0">
                        {p.author_name.charAt(0)}
                      </div>
                      <span className="text-xs text-[#8B949E] truncate">{p.author_name}</span>
                    </div>
                    <a href={p.link} target="_blank" rel="noreferrer" className="text-[#58A6FF] hover:text-white font-mono text-xs whitespace-nowrap transition-colors">
                      View →
                    </a>
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
