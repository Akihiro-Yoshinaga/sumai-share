import { NavLink, Outlet, Link } from 'react-router-dom';
import { Heart, Home, Calendar, CheckSquare, Settings } from 'lucide-react';

const navItems = [
  { to: '/',           label: '条件',      icon: Heart },
  { to: '/properties', label: '物件',      icon: Home },
  { to: '/routine',    label: 'ルーティン', icon: Calendar },
  { to: '/tasks',      label: 'タスク',    icon: CheckSquare },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-navy-900 text-white sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <Home size={13} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight text-sm">すまいシェア</span>
          <span className="ml-auto text-xs text-white/40">あきひろ & あかり</span>
          <Link to="/settings" className="ml-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Settings size={16} className="text-white/60" />
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 px-2 text-center transition-colors ${
                  isActive
                    ? 'text-navy-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-navy-900' : 'bg-transparent'
                  }`}>
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                  </span>
                  <span className={`text-xs font-medium ${isActive ? 'text-navy-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
