import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { Button } from '../components/ui/Button';
import { generateKeyPair, exportPublicKey, exportPrivateKey } from '../lib/crypto';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', res.token);

      if (!localStorage.getItem('private_key')) {
        const keyPair = await generateKeyPair();
        const pubKey = await exportPublicKey(keyPair.publicKey);
        const privKey = await exportPrivateKey(keyPair.privateKey);
        await fetchAPI('/users/profile', { method: 'PUT', body: JSON.stringify({ public_key: pubKey }) });
        localStorage.setItem('private_key', privKey);
      }

      signIn(res.token, res.user);
      navigate('/discover');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-8">
      <div className="glass p-6 sm:p-8 rounded-xl w-full max-w-md border border-white/10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Initialize Session
        </h2>
        {error && <div className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login _'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
