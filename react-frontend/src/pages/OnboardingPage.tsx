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
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full glass p-8 rounded-xl border border-cyan-500/30 relative overflow-hidden">
        <h1 className="text-4xl font-extrabold mb-6 text-cyan-400">Welcome to the Network, {user.name}</h1>
        <p className="text-gray-400 mb-8 font-mono">Configure your developer identity.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">Primary Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
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
              className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 resize-none"
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
