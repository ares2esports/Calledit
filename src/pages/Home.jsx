import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Card, Button, Input, Badge, Spinner } from '../components/Ui';
import IdentityGate from '../components/IdentityGate';

export default function Home() {
  const { user, mode, myPools, createPool, joinPool, setName } = useStore();
  const [pools, setPools] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [err, setErr] = useState('');
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (user) myPools().then(setPools);
  }, [user, myPools]);

  if (!user) return <IdentityGate />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Playing as <b className="text-emerald-900">{user.name}</b>{' '}
          <button className="text-emerald-700 underline text-xs" onClick={() => { setNameDraft(user.name); setEditName(true); }}>
            edit
          </button>
        </div>
      </div>
      {editName && (
        <Card className="p-4 flex gap-2">
          <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={24} />
          <Button onClick={async () => { await setName(nameDraft.trim() || user.name); setEditName(false); }}>Save</Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-bold text-emerald-900">My pools</h2>
        {pools === null ? (
          <Spinner />
        ) : pools.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">No pools yet — create one or join with a code.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {pools.map((p) => (
              <Link
                key={p.id}
                to={`/pool/${p.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition"
              >
                <div>
                  <div className="font-semibold text-emerald-900">{p.name}</div>
                  <div className="text-xs text-gray-500">Code: {p.code}</div>
                </div>
                <Badge>{new Date(p.lockAt) > new Date() ? 'Open' : 'Locked'}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-emerald-900">Create a pool</h3>
          {showCreate ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const pool = await createPool({ name: poolName.trim(), isPublic });
                  nav(`/pool/${pool.id}`);
                } catch (ex) { setErr(ex.message); }
              }}
            >
              <Input placeholder="Pool name (e.g. Office Cup)" value={poolName} onChange={(e) => setPoolName(e.target.value)} required maxLength={40} />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Public brackets (members can see each other's picks before lock)
              </label>
              <Button type="submit" className="w-full" disabled={!poolName.trim()}>Create pool</Button>
            </form>
          ) : (
            <Button className="mt-3 w-full" onClick={() => setShowCreate(true)}>New pool</Button>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-emerald-900">Join a pool</h3>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr('');
              try {
                const pool = await joinPool(joinCode);
                nav(`/pool/${pool.id}`);
              } catch (ex) { setErr(ex.message); }
            }}
          >
            <Input placeholder="6-letter code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
            <Button type="submit" disabled={joinCode.length !== 6}>Join</Button>
          </form>
        </Card>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {mode === 'demo' && (
        <p className="text-xs text-gray-500 text-center">
          Demo mode stores everything on this device. Connect Supabase for real multi-player pools — see the README.
        </p>
      )}
    </div>
  );
}
