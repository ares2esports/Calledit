import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { ROUNDS, matchesInRound } from '../lib/tournament';
import { Card, Button, Input, Spinner } from '../components/Ui';

function ResultRow({ match, result, editing, onSave }) {
  const [t1, setT1] = useState(result?.team1 || '');
  const [t2, setT2] = useState(result?.team2 || '');
  const [s1, setS1] = useState(result?.score1 ?? '');
  const [s2, setS2] = useState(result?.score2 ?? '');
  const [winner, setWinner] = useState(result?.winner || null);

  const label1 = result?.team1 || (match.team1.type === 'slot' ? match.team1.label : `W${match.team1.match}`);
  const label2 = result?.team2 || (match.team2.type === 'slot' ? match.team2.label : `W${match.team2.match}`);

  if (!editing) {
    const done = result?.winner;
    return (
      <div className="flex items-center justify-between py-2 text-sm">
        <span className="text-xs text-gray-400 w-10">M{match.num}</span>
        <span className={`flex-1 ${done && result.winner === 'team1' ? 'font-bold text-emerald-900' : 'text-gray-700'}`}>{label1}</span>
        <span className="px-2 text-xs font-bold text-gray-500 tabular-nums">
          {result?.score1 != null ? `${result.score1} – ${result.score2}` : match.date}
        </span>
        <span className={`flex-1 text-right ${done && result.winner === 'team2' ? 'font-bold text-emerald-900' : 'text-gray-700'}`}>{label2}</span>
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-emerald-50 space-y-2">
      <div className="text-xs text-gray-400">Match {match.num} · {match.venue} · {match.date}</div>
      <div className="flex gap-2 items-center">
        <Input placeholder={label1} value={t1} onChange={(e) => setT1(e.target.value)} className="text-xs" />
        <Input type="number" value={s1} onChange={(e) => setS1(e.target.value)} className="!w-16 text-center text-xs" min="0" />
        <span className="text-gray-400 text-xs">–</span>
        <Input type="number" value={s2} onChange={(e) => setS2(e.target.value)} className="!w-16 text-center text-xs" min="0" />
        <Input placeholder={label2} value={t2} onChange={(e) => setT2(e.target.value)} className="text-xs" />
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-500">Winner:</span>
        {['team1', 'team2'].map((side) => (
          <button
            key={side}
            onClick={() => setWinner(winner === side ? null : side)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold ${winner === side ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}
          >
            {side === 'team1' ? (t1 || label1) : (t2 || label2)}
          </button>
        ))}
        <Button
          variant="secondary"
          className="!py-1 !px-3 text-xs ml-auto"
          onClick={() => onSave(match.num, {
            team1: t1 || result?.team1 || null,
            team2: t2 || result?.team2 || null,
            score1: s1 === '' ? null : +s1,
            score2: s2 === '' ? null : +s2,
            winner,
          })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const { results, syncResults, setResult, refreshResults } = useStore();
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');

  if (!results) return <Spinner />;

  const doSync = async () => {
    setSyncing(true); setMsg('');
    try {
      await syncResults();
      setMsg('Synced from public feed ✓');
    } catch (e) {
      setMsg(`Sync failed: ${e.message}. You can enter results manually below.`);
    }
    setSyncing(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Link to={`/pool/${id}`} className="text-xs text-emerald-700 font-semibold">← Back to pool</Link>
        <h1 className="font-extrabold text-emerald-900 mt-1">Match results</h1>
        <p className="text-xs text-gray-500 mt-1">
          Results auto-sync from the free openfootball public feed (updated by the community during the
          tournament). Scores recalculate instantly for everyone in the pool.
        </p>
        <div className="flex gap-2 mt-3 items-center">
          <Button onClick={doSync} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync now'}</Button>
          <Button variant="ghost" onClick={() => setEditing(!editing)}>
            {editing ? 'Done editing' : 'Manual entry'}
          </Button>
        </div>
        {msg && <p className="text-xs mt-2 text-emerald-700 font-semibold">{msg}</p>}
        {results.fetchedAt && (
          <p className="text-[10px] text-gray-400 mt-1">Last updated {new Date(results.fetchedAt).toLocaleString()}</p>
        )}
      </Card>

      {ROUNDS.map((r) => (
        <Card key={r.key} className="p-4">
          <h2 className="font-bold text-emerald-900 text-sm mb-1">{r.label}</h2>
          <div className={editing ? '' : 'divide-y divide-emerald-50'}>
            {matchesInRound(r.key).map((m) => (
              <ResultRow
                key={`${m.num}-${editing}`}
                match={m}
                result={results.matches?.[m.num]}
                editing={editing}
                onSave={async (num, patch) => { await setResult(num, patch); await refreshResults(); }}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
