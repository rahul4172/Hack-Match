import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    winnings: '',
    learnings: '',
    github: '',
    linkedin: '',
    skills: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      let parsedSkills = '';
      try {
        const arr = JSON.parse(user.skills);
        if (Array.isArray(arr)) parsedSkills = arr.join(', ');
      } catch (e) {}

      setFormData({
        name: user.name || '',
        role: user.role || '',
        bio: user.bio || '',
        winnings: user.winnings || '',
        learnings: user.learnings || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        skills: parsedSkills
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const res = await fetchAPI('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          skills: JSON.stringify(skillsArray)
        })
      });
      updateProfile(res);
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setMsg(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center p-8 mt-16 text-gray-500">Please sign in.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF] font-mono">Profile_Config</h1>
      
      {/* Gamification / Status Section */}
      <div className="mb-8 sm:mb-10 ultra-glass p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#58A6FF]/10 blur-[50px] pointer-events-none" />
        
        <div className="flex-shrink-0 text-center relative">
           <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#3FB950] border-dashed flex items-center justify-center bg-[#0D1117] text-4xl mb-2 animate-[spin_10s_linear_infinite]">
             <div className="animate-[spin_10s_linear_infinite_reverse]">😎</div>
           </div>
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#3FB950] text-[#0D1117] font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(63,185,80,0.5)]">
             Level 42
           </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 font-mono gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-glow">{formData.name || 'Anonymous User'}</h2>
            <div className="text-xs text-[#8B949E]">Rank: <span className="text-[#BC8CFF] text-glow">Architect</span></div>
          </div>
          
          <div className="mb-1 flex justify-between text-xs text-[#8B949E] font-mono">
            <span>XP: 8,450</span>
            <span>Next Level: 10,000</span>
          </div>
          <div className="w-full bg-[#010409] rounded-full h-2.5 mb-5 sm:mb-6 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF] h-2.5 rounded-full shadow-[0_0_15px_rgba(88,166,255,0.8)]" style={{ width: '84.5%' }}></div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-[#8B949E] mb-2 font-bold">Unlocked Badges</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col items-center group cursor-pointer">
                <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] transform group-hover:scale-125 transition-transform">🏆</span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Hackathon Winner</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <span className="text-2xl drop-shadow-[0_0_15px_rgba(88,166,255,0.8)] transform group-hover:scale-125 transition-transform">🔥</span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">7 Day Streak</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <span className="text-2xl drop-shadow-[0_0_15px_rgba(63,185,80,0.8)] transform group-hover:scale-125 transition-transform">🐛</span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Bug Hunter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {msg && <div className="mb-4 p-3 bg-gray-800 border border-gray-700 text-cyan-300 rounded-md text-sm">{msg}</div>}
      
      <form onSubmit={handleSave} className="space-y-5 sm:space-y-6 ultra-glass p-5 sm:p-8 rounded-2xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role / Title</label>
            <input name="role" value={formData.role} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="e.g. Frontend Engineer" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none h-24 text-sm" />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Skills (Comma separated)</label>
          <input name="skills" value={formData.skills} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="React, Node, Python..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recent Winnings / Achievements</label>
            <textarea name="winnings" value={formData.winnings} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none h-20 text-sm" placeholder="1st Place at ETHDenver..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Learnings / Looking for</label>
            <textarea name="learnings" value={formData.learnings} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none h-20 text-sm" placeholder="Learning Rust, looking for a Web3 team..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">GitHub Username</label>
            <input name="github" value={formData.github} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">LinkedIn Username</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" />
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}
