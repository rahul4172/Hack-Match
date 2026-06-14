import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';

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

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      await fetchAPI('/projects', {
        method: 'POST',
        body: JSON.stringify({ ...formData, tags: JSON.stringify(tagsArray) })
      });
      setShowForm(false);
      setFormData({ title: '', description: '', link: '', tags: '' });
      loadProjects();
    } catch (err) {
      alert("Failed to add project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          Project Spotlight
        </h1>
        {user && (
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Share Project _'}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="glass p-6 rounded-xl mb-8 border border-orange-500/30 max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-orange-400">Share Your Latest Build</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 h-24" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project Link (GitHub / Live URL)</label>
              <input required value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
              <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="React, AI, Web3..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500" />
            </div>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Sharing...' : 'Share Now'}
            </Button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-orange-500 animate-pulse font-mono">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-500 italic">No projects shared yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map(p => {
            let tags: string[] = [];
            try { tags = JSON.parse(p.tags || '[]'); } catch (e) {}
            
            return (
              <div key={p.id} className="glass p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{p.title}</h3>
                <p className="text-gray-300 mb-4 flex-1">{p.description}</p>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-1 text-xs font-mono bg-orange-900/20 text-orange-300 rounded border border-orange-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold">
                      {p.author_name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-400">{p.author_name}</span>
                  </div>
                  
                  <a href={p.link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 font-mono text-sm">
                    [ View Project ]
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
