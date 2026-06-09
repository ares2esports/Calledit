import { Routes, Route, Link } from 'react-router-dom';
import { useStore } from './lib/store';
import { Spinner } from './components/Ui';
import Home from './pages/Home';
import PoolPage from './pages/PoolPage';
import BracketPage from './pages/BracketPage';
import ResultsPage from './pages/ResultsPage';
import JoinPage from './pages/JoinPage';
import SharedPage from './pages/SharedPage';

export default function App() {
  const { ready, mode, user, signOut } = useStore();
  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-emerald-700 text-white grid place-items-center text-lg">✓</span>
          <div>
            <div className="font-extrabold text-emerald-900 leading-tight">CalledIt</div>
            <div className="text-[11px] text-emerald-600 leading-tight">World Cup 2026</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {mode === 'demo' && (
            <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">Demo mode</span>
          )}
          {user && mode === 'supabase' && (
            <button onClick={signOut} className="text-emerald-700 font-semibold hover:underline">Sign out</button>
          )}
        </div>
      </header>
      {!ready ? (
        <Spinner />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pool/:id" element={<PoolPage />} />
          <Route path="/pool/:id/bracket/:memberId" element={<BracketPage />} />
          <Route path="/pool/:id/results" element={<ResultsPage />} />
          <Route path="/join/:code" element={<JoinPage />} />
          <Route path="/shared/:data" element={<SharedPage />} />
        </Routes>
      )}
    </div>
  );
}
