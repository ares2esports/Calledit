import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { rankMembers } from '../lib/scoring';
import { Card, Button, Input, Badge, Spinner } from '../components/Ui';

export default function PoolPage() {
  const { id } = useParams();
  const { user, mode, results, loadPool, subscribePool, addLocalMember, syncResults } = useStore();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [newPlayer, setNewPlayer] = useState('');
  const [syncing, setSyncing] = useState(false);
  const nav = useNavigate();

  const refresh = useCallback(() => {
    loadPool(id).then(setData).catch((e) => setErr(e.message));
  }, [id, loadPool]);

  useEffect(() => {
    refresh();
    return subscribePool(id, refresh);
  }, [id, refresh, subscribePool]);

  if (err) return <Card className="p-5 text-red-600 text-sm">{err}</Card>;
  if (!data) return <Spinner />;

  const { pool, members, brackets } = data;
  const locked = new Date(pool.lockAt) <= new Date();
  const rows = rankMembers(members, brackets, results, pool.scoring);
  const inviteUrl = `${location.origin}${location.pathname}#/join/${pool.code}`;
  const isMember = members.some((m) => m.id === user?.id);

  const copyInvite = async () => {
    try {
      if (navigator.share) await navigator.share({ title: pool.name, text: 'Join my World Cup pool!', url: inviteUrl });
      else { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* user cancelled */ }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-emerald-900">{pool.name}</h1>
            <div className="text-xs text-gray-500 mt-1">
              Code <b>{pool.code}</b> · {members.length} player{members.length !== 1 && 's'}
            </div>
          </div>
          <Badge color={locked ? 'red' : 'emerald'}>{locked ? 'Picks locked' : 'Picks open'}</Badge>
        </div>
        {!locked && (
          <p className="text-xs text-gray-500 mt-2">
            Picks lock {new Date(pool.lockAt).toLocaleString()} (Round of 32 kickoff).
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {isMember && <Button onClick={() => nav(`/pool/${id}/bracket/${user.id}`)}>My bracket</Button>}
          <Button variant="secondary" onClick={copyInvite}>{copied ? 'Link copied!' : 'Invite friends'}</Button>
          <Link to={`/pool/${id}/results`}><Button variant="ghost">Match results</Button></Link>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-emerald-900">Leaderboard</h2>
          <button
            className="text-xs text-emerald-700 font-semibold underline disabled:opacity-50"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              try { await syncResults(); refresh(); } catch (e) { setErr(e.message); }
              setSyncing(false);
            }}
          >
            {syncing ? 'Syncing…' : 'Sync results'}
          </button>
        </div>
        <div className="mt-3 divide-y divide-emerald-50">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`/pool/${id}/bracket/${r.id}`}
              className="flex items-center gap-3 py-2.5 hover:bg-emerald-50 rounded-lg px-2 -mx-2 transition"
            >
              <span className={`w-7 h-7 grid place-items-center rounded-full text-xs font-bold shrink-0
                ${r.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {r.rank}
              </span>
              <span className="flex-1 font-semibold text-sm text-gray-800 truncate">
                {r.name} {r.id === user?.id && <span className="text-emerald-600 text-xs">(you)</span>}
              </span>
              {!r.hasPicks && <Badge color="amber">no picks</Badge>}
              {r.tiebreakDiff != null && <span className="text-[10px] text-gray-400">TB ±{r.tiebreakDiff}</span>}
              <span className="font-extrabold text-emerald-900 tabular-nums">{r.total}</span>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          Scoring: R32 {pool.scoring.R32} · R16 {pool.scoring.R16} · QF {pool.scoring.QF} · SF {pool.scoring.SF} ·
          Final {pool.scoring.F} · Champion bonus {pool.scoring.champBonus}. Ties broken by predicted goals in the final.
        </p>
      </Card>

      {mode === 'demo' && !locked && (
        <Card className="p-5">
          <h3 className="font-bold text-emerald-900 text-sm">Pass-and-play (demo)</h3>
          <p className="text-xs text-gray-500 mt-1 mb-2">Add friends on this device — hand them the phone to make picks.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const m = addLocalMember(id, newPlayer.trim());
              if (m) { setNewPlayer(''); refresh(); }
            }}
          >
            <Input placeholder="Player name" value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} maxLength={24} />
            <Button type="submit" variant="secondary" disabled={!newPlayer.trim()}>Add</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
