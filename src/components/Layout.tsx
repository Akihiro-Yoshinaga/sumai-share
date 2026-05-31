import { NavLink, Outlet } from 'react-router-dom';
import { Heart, Home, Calendar } from 'lucide-react';

const navItems = [
  { to: '/', label: '価値観リスト', icon: Heart },
  { to: '/properties', label: '物件トラッカー', icon: Home },
  { to: '/routine', label: 'ルーティン', icon: Calendar },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-navy-900 text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Home size={15} className="text-white" />
            </div>
            <span className="font-semibold tracking-tight text-sm">すまいシェア</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        すまいシェア — Phase 1 Mock
      </footer>
    </div>
  );
}
