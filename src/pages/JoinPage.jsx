import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Card, Button } from '../components/Ui';
import IdentityGate from '../components/IdentityGate';

export default function JoinPage() {
  const { code } = useParams();
  const { user, joinPool } = useStore();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (!user) {
    return (
      <div className="space-y-4">
        <Card className="p-4 text-sm text-gray-700">
          You've been invited to a pool (code <b>{code}</b>). First, tell us who you are:
        </Card>
        <IdentityGate />
      </div>
    );
  }

  return (
    <Card className="p-6 text-center space-y-3">
      <h1 className="font-extrabold text-emerald-900 text-lg">Join pool {code}?</h1>
      <p className="text-sm text-gray-600">You'll appear on the leaderboard as <b>{user.name}</b>.</p>
      <Button
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true); setErr('');
          try {
            const pool = await joinPool(code);
            nav(`/pool/${pool.id}`);
          } catch (e) { setErr(e.message); setBusy(false); }
        }}
      >
        {busy ? 'Joining…' : 'Join pool'}
      </Button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </Card>
  );
}
