import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';

export default function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('Frontend Engineer');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchAPI('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ role, bio })
      });
      updateProfile(res);
      navigate('/discover');
    } catch (err) {
      alert("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl glass p-6 sm:p-8 rounded-xl border border-cyan-500/30 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[80px] pointer-events-none rounded-full -mr-12 -mt-12" />

        <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 sm:mb-3 text-cyan-400 leading-tight">
          Welcome to the Network,<br className="sm:hidden" /> {user.name} 👋
        </h1>
        <p className="text-gray-400 mb-6 sm:mb-8 font-mono text-sm">Configure your developer identity.</p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">Primary Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 text-sm appearance-none"
            >
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
            <label className="block text-sm font-mono text-gray-400 mb-2">Bio / Objective</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What are you building or looking to build?"
              className="w-full h-28 sm:h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 resize-none text-sm"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Initializing...' : 'Join Network _'}
          </Button>
        </form>
      </div>
    </div>
  );
}
