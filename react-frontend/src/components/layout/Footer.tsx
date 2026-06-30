import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="section-padding border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="HackMatch Logo" className="w-6 h-6 rounded object-contain" />
            <p className="font-display font-bold text-lg gradient-text m-0">HackMatch</p>
          </div>
          <p className="text-sm text-slate-400 max-w-xs">Find your hackathon squad. Swipe, match, build.</p>
        </div>
        {[
          { title: 'Product', links: [{ l: 'Discover', h: '/discover' }, { l: 'Radar', h: '/radar' }, { l: 'Spotlight', h: '/spotlight' }] },
          { title: 'Network', links: [{ l: 'Connections', h: '/connections' }, { l: 'Terminal', h: '/chat' }, { l: 'Profile', h: '/profile' }] },
          { title: 'Account', links: [{ l: 'Sign In', h: '/signin' }, { l: 'Sign Up', h: '/signup' }] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-semibold text-white mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map(link => (
                <li key={link.l}>
                  <Link to={link.h} className="text-sm text-slate-400 hover:text-violet-400 transition-colors">{link.l}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} HackMatch</span>
        <span>Built for builders who ship at 2am</span>
      </div>
    </footer>
  );
}
