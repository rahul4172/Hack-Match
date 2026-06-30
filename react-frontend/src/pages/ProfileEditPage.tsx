import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { PageHeader } from '../components/ui/PageHeader';
import { User, Trophy, Flame, Bug, MapPin } from 'lucide-react';

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
    skills: '',
    location: '',
    lat: 0,
    lng: 0
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
        skills: parsedSkills,
        location: user.location || '',
        lat: user.lat || 0,
        lng: user.lng || 0
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setFormData(prev => ({ ...prev, lat, lng }));
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village;
        const state = data.address.state;
        if (city && state) {
          setFormData(prev => ({ ...prev, location: `${city}, ${state}` }));
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      } finally {
        setLoading(false);
      }
    }, () => {
      alert('Unable to retrieve your location');
      setLoading(false);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      let avatarUrl = user?.avatar || '';
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', avatarFile);
        const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
          method: 'POST',
          body: formDataUpload
        });
        const imgData = await imgRes.json();
        if (!imgData.success) throw new Error('Failed to upload image');
        avatarUrl = imgData.data.url;
      }

      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const res = await fetchAPI('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
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
      <PageHeader title="Profile Config" subtitle="Customize your developer identity" />

      <GlowCard variant="cyan" tilt={false} className="mb-8 sm:mb-10">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#58A6FF]/10 blur-[50px] pointer-events-none" />
        
        <div className="flex-shrink-0 text-center relative">
           <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#3FB950] border-dashed flex items-center justify-center bg-[#0D1117] text-[#3FB950] mb-2 animate-[spin_10s_linear_infinite]">
             <div className="animate-[spin_10s_linear_infinite_reverse] flex items-center justify-center w-full h-full"><User className="w-8 h-8" /></div>
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
                <span className="p-2 rounded-full bg-yellow-500/10 text-yellow-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] transform group-hover:scale-110 transition-transform"><Trophy className="w-5 h-5" /></span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Hackathon Winner</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <span className="p-2 rounded-full bg-[#58A6FF]/10 text-[#58A6FF] drop-shadow-[0_0_15px_rgba(88,166,255,0.8)] transform group-hover:scale-110 transition-transform"><Flame className="w-5 h-5" /></span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">7 Day Streak</span>
              </div>
              <div className="flex flex-col items-center group cursor-pointer">
                <span className="p-2 rounded-full bg-[#3FB950]/10 text-[#3FB950] drop-shadow-[0_0_15px_rgba(63,185,80,0.8)] transform group-hover:scale-110 transition-transform"><Bug className="w-5 h-5" /></span>
                <span className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Bug Hunter</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </GlowCard>
      
      {msg && <div className="mb-4 p-3 bg-[#58A6FF]/10 border border-[#58A6FF]/30 text-[#58A6FF] rounded-xl text-sm">{msg}</div>}
      
      <GlowCard variant="purple" tilt={false}>
      <form onSubmit={handleSave} className="space-y-5 sm:space-y-6 p-5 sm:p-8">
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Profile Picture</label>
          <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-lg p-3">
            {avatarPreview ? (
              <img src={avatarPreview} alt="preview" className="w-12 h-12 rounded-full object-cover border border-[#58A6FF]" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[#8B949E]">Pic</div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-[#8B949E] file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#58A6FF]/10 file:text-[#58A6FF] hover:file:bg-[#58A6FF]/20" />
          </div>
        </div>

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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm text-gray-400">Location (City, State)</label>
            <button type="button" onClick={handleAutoDetect} className="text-xs text-[#58A6FF] hover:text-[#58A6FF]/80 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Auto-Detect
            </button>
          </div>
          <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none text-sm" placeholder="e.g. San Francisco, CA" />
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
      </GlowCard>
    </div>
  );
}
