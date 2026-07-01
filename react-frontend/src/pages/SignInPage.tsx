import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { GlowCard } from '../components/ui/GlowCard';
import { Eye, EyeOff } from 'lucide-react';
export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchAPI('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', res.token);



      signIn(res.token, res.user);
      navigate('/discover');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
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
        <GlowCard variant="cyan" tilt={false} className="w-full">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#58A6FF] to-[#BC8CFF]">
              Initialize Session
            </h2>
            <p className="text-center text-[#8B949E] text-sm font-mono mb-6">Secure developer authentication</p>

            {error && (
              <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#58A6FF]/50 focus:shadow-[0_0_20px_rgba(88,166,255,0.15)] transition-all text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-[#8B949E] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-white focus:outline-none focus:border-[#58A6FF]/50 focus:shadow-[0_0_20px_rgba(88,166,255,0.15)] transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full mt-2 py-3" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login _'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#8B949E]">
              No account?{' '}
              <Link to="/signup" className="text-[#58A6FF] hover:text-white transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </GlowCard>
      </motion.div>
    </div>
  );
}
