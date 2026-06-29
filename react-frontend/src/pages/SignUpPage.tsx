import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { generateKeyPair, exportPublicKey, exportPrivateKey } from '../lib/crypto';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const keyPair = await generateKeyPair();
      const pubKey = await exportPublicKey(keyPair.publicKey);
      const privKey = await exportPrivateKey(keyPair.privateKey);

      const res = await fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, public_key: pubKey }),
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
              <Button type="submit" variant="primary" className="w-full mt-2 py-3" disabled={loading}>
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
