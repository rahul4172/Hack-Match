import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { generateKeyPair, exportPublicKey, exportPrivateKey } from '../lib/crypto';
import { MapPin, CheckCircle } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [location, setLocation] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setLat(latitude);
      setLng(longitude);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village;
        const state = data.address.state;
        if (city && state) setLocation(`${city}, ${state}`);
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      } finally {
        setLocLoading(false);
      }
    }, () => {
      setError('You must allow location access to join HackMatch.');
      setLocLoading(false);
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lat === null || lng === null) {
      setError('Location tracking is mandatory to join HackMatch');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const keyPair = await generateKeyPair();
      const pubKey = await exportPublicKey(keyPair.publicKey);
      const privKey = await exportPrivateKey(keyPair.privateKey);

      const res = await fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, public_key: pubKey, lat, lng, location }),
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('private_key', privKey);
      signIn(res.token, res.user);
      navigate('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlowCard variant="purple" tilt={false} className="w-full">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#BC8CFF] to-[#58A6FF]">
              Create Identity
            </h2>
            <p className="text-center text-[#8B949E] text-sm font-mono mb-6">Join the hackathon network</p>

            {error && (
              <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#BC8CFF]/50 focus:shadow-[0_0_20px_rgba(188,140,255,0.15)] transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#BC8CFF]/50 transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#BC8CFF]/50 transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Location (Required)</label>
                {!lat ? (
                  <button type="button" onClick={handleDetectLocation} disabled={locLoading} className="w-full bg-black/40 border border-[#58A6FF]/50 text-[#58A6FF] rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-[#58A6FF]/10 transition-all text-sm">
                    <MapPin className="w-4 h-4" /> {locLoading ? 'Detecting...' : 'Detect Location'}
                  </button>
                ) : (
                  <div className="w-full bg-[#3FB950]/10 border border-[#3FB950]/30 text-[#3FB950] rounded-xl p-3 flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4" /> {location || 'Location Secured'}
                  </div>
                )}
              </div>
              <Button type="submit" variant="primary" className="w-full mt-2 py-3" disabled={loading || !lat}>
                {loading ? 'Processing...' : 'Register _'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#8B949E]">
              Have an account?{' '}
              <Link to="/signin" className="text-[#58A6FF] hover:text-white transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}
