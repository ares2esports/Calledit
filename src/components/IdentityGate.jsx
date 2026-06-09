import { useState } from 'react';
import { useStore } from '../lib/store';
import { Card, Button, Input } from './Ui';

// Shown when no user identity exists yet.
// Demo mode: pick a display name. Supabase mode: magic link / Google.
export default function IdentityGate() {
  const { mode, setName, signInEmail, signInGoogle } = useStore();
  const [name, setNameInput] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (mode === 'demo') {
    return (
      <Card className="p-5">
        <h2 className="font-bold text-emerald-900 text-lg">Welcome!</h2>
        <p className="text-sm text-gray-600 mt-1 mb-3">Pick a display name to get started.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) setName(name.trim()); }}
          className="flex gap-2"
        >
          <Input placeholder="Your name" value={name} onChange={(e) => setNameInput(e.target.value)} maxLength={24} />
          <Button type="submit" disabled={!name.trim()}>Go</Button>
        </form>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 mt-4">
          <b>Demo mode</b> — everything is stored on this device only. To play with friends across
          devices, connect Supabase (see README, ~10 minutes).
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="font-bold text-emerald-900 text-lg">Sign in</h2>
      <p className="text-sm text-gray-600 mt-1 mb-3">We'll email you a magic link — no password needed.</p>
      {sent ? (
        <p className="text-sm bg-emerald-50 text-emerald-800 rounded-xl p-3">
          Check your inbox! Open the link on this device to finish signing in.
        </p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            try { await signInEmail(email); setSent(true); }
            catch (ex) { setErr(ex.message); }
          }}
          className="space-y-2"
        >
          <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full">Email me a magic link</Button>
          <Button type="button" variant="secondary" className="w-full" onClick={signInGoogle}>
            Continue with Google
          </Button>
          {err && <p className="text-xs text-red-600">{err}</p>}
        </form>
      )}
    </Card>
  );
}
