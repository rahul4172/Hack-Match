import { useState } from 'react';
import { Button } from './Button';

interface SubscriptionModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export function SubscriptionModal({ onClose, onSubscribe }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubscribe();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center p-8 border-b border-white/5 bg-black/50">
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Choose Your Arsenal
          </h2>
          <p className="text-gray-400 font-mono text-sm">Unlock the full power of the HackMatch network.</p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row p-8 gap-8">
          
          {/* Free Tier */}
          <div className="flex-1 p-6 rounded-xl border border-white/5 bg-white/5 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">10-Minute Trial</h3>
            <div className="text-3xl font-extrabold text-white mb-6">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-sm text-gray-400"><span className="text-cyan-500 mr-2">✓</span> Full Radar Access</li>
              <li className="flex items-center text-sm text-gray-400"><span className="text-cyan-500 mr-2">✓</span> Browse Developers</li>
              <li className="flex items-center text-sm text-gray-400"><span className="text-cyan-500 mr-2">✓</span> View Network</li>
              <li className="flex items-center text-sm text-red-400/80"><span className="text-red-500 mr-2">!</span> Session ends strictly in 10m</li>
            </ul>
            <Button variant="ghost" className="w-full" onClick={async () => {
              setLoading(true);
              try {
                const { fetchAPI } = await import('./../../lib/api');
                const { useAuth } = await import('./../../store/useAuth');
                const res = await fetchAPI('/auth/guest', { method: 'POST' });
                useAuth.getState().signIn(res.token, res.user);
                setTimeout(() => { setLoading(false); window.location.href = '/discover'; }, 1000);
              } catch(e) { setLoading(false); }
            }} disabled={loading}>
              Initialize Guest Session _
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="flex-1 p-6 rounded-xl border border-cyan-500/50 bg-cyan-900/10 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Pro Builder</h3>
            <div className="text-3xl font-extrabold text-white mb-6">$9<span className="text-lg text-cyan-500/50 font-normal">/mo</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center text-sm text-white"><span className="text-cyan-400 mr-2">✓</span> Infinite Swipes</li>
              <li className="flex items-center text-sm text-white"><span className="text-cyan-400 mr-2">✓</span> Premium Radar AI Matching</li>
              <li className="flex items-center text-sm text-white"><span className="text-cyan-400 mr-2">✓</span> Unlimited Ideas</li>
              <li className="flex items-center text-sm text-white"><span className="text-cyan-400 mr-2">✓</span> Broadcast Team Signals</li>
              <li className="flex items-center text-sm text-white"><span className="text-cyan-400 mr-2">✓</span> Priority Inbox</li>
            </ul>
            <Button variant="primary" className="w-full shadow-[0_0_15px_rgba(88,166,255,0.4)] bg-[#58A6FF] hover:bg-[#58A6FF]/80 text-[#0D1117] font-bold" onClick={async () => {
              alert('Pro tier is currently in testing phase. Redirecting you to the Free 10-Minute Trial...');
              setLoading(true);
              try {
                const { fetchAPI } = await import('./../../lib/api');
                const { useAuth } = await import('./../../store/useAuth');
                const res = await fetchAPI('/auth/guest', { method: 'POST' });
                useAuth.getState().signIn(res.token, res.user);
                setTimeout(() => { setLoading(false); window.location.href = '/discover'; }, 500);
              } catch(e) { setLoading(false); }
            }} disabled={loading}>
              {loading ? 'Initializing...' : 'Upgrade to Pro _'}
            </Button>
          </div>
          
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
