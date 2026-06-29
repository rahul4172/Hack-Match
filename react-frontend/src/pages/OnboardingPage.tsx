import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('Frontend Engineer');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/signin');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchAPI('/users/profile', { method: 'PUT', body: JSON.stringify({ role, bio }) });
      updateProfile(res);
      navigate('/discover');
    } catch {
      alert('Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <GlowCard variant="cyan" tilt={false}>
          <div className="p-6 sm:p-8 relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#58A6FF]/10 blur-[60px] pointer-events-none rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF]">
              Welcome, {user.name} 👋
            </h1>
            <p className="text-[#8B949E] mb-6 font-mono text-sm">Configure your developer identity</p>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-2">Primary Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#58A6FF]/50 text-sm">
                  <option>Frontend Engineer</option>
                  <option>Backend Engineer</option>
                  <option>Fullstack Developer</option>
                  <option>UI/UX Designer</option>
                  <option>AI/ML Researcher</option>
                  <option>DevOps / Cloud</option>
                  <option>Product Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-2">Bio / Objective</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="What are you building or looking to build?" className="w-full h-28 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#58A6FF]/50 resize-none text-sm" />
              </div>
              <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
                {loading ? 'Initializing...' : 'Join Network _'}
              </Button>
            </form>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}
