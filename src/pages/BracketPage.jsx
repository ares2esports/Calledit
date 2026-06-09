import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { MATCHES, FINAL_NUM, predictedWinner, matchByNum } from '../lib/tournament';
import { encodeBracket } from '../lib/share';
import Bracket from '../components/Bracket';
import { Card, Button, Input, Badge, Spinner } from '../components/Ui';

export default function BracketPage() {
  const { id, memberId } = useParams();
  const { user, mode, results, loadPool, saveBracket } = useStore();
  const [data, setData] = useState(null);
  const [picks, setPicks] = useState({});
  const [tiebreaker, setTiebreaker] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    loadPool(id).then((d) => {
      setData(d);
      const b = d.brackets[memberId];
      setPicks(b?.picks || {});
      setTiebreaker(b?.tiebreaker ?? '');
    }).catch((e) => setErr(e.message));
  }, [id, memberId, loadPool]);

  if (err) return <Card className="p-5 text-red-600 text-sm">{err}</Card>;
  if (!data) return <Spinner />;

  const { pool, members } = data;
  const member = members.find((m) => m.id === memberId);
  const locked = new Date(pool.lockAt) <= new Date();
  const isSelf = memberId === user?.id;
  const canEdit = !locked && (mode === 'demo' || isSelf);
  const hidden = !locked && !isSelf && !pool.isPublic && mode !== 'demo';
  const pickedCount = MATCHES.filter((m) => picks[m.num]).length;
  const champ = predictedWinner(matchByNum[FINAL_NUM], picks, results);

  const onPick = (num, side) => {
    setPicks((p) => ({ ...p, [num]: side }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await saveBracket(id, memberId, picks, tiebreaker === '' ? null : +tiebreaker);
      setDirty(false);
      setMsg('Saved ✓');
      setTimeout(() => setMsg(''), 2500);
    } catch (e) { setMsg(e.message); }
    setSaving(false);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/shared/${encodeBracket(member?.name, picks, tiebreaker === '' ? null : +tiebreaker)}`;
    try {
      if (navigator.share) await navigator.share({ title: 'My World Cup bracket', url });
      else { await navigator.clipboard.writeText(url); setMsg('Share link copied ✓'); setTimeout(() => setMsg(''), 2500); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Link to={`/pool/${id}`} className="text-xs text-emerald-700 font-semibold">← {pool.name}</Link>
            <h1 className="font-extrabold text-emerald-900">{member?.name || 'Bracket'}{isSelf && ' (you)'}</h1>
          </div>
          <Badge color={locked ? 'red' : canEdit ? 'emerald' : 'gray'}>
            {locked ? 'Locked' : canEdit ? `${pickedCount}/${MATCHES.length} picked` : 'View only'}
          </Badge>
        </div>
        {champ && (
          <p className="text-sm mt-2">Champion pick: <b className="text-emerald-900">{champ}</b></p>
        )}
        {canEdit && (
          <div className="flex items-center gap-2 mt-3">
            <Button onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : dirty ? 'Save picks' : 'Saved'}</Button>
            <Button variant="secondary" onClick={share}>Share</Button>
            {msg && <span className="text-xs text-emerald-700 font-semibold">{msg}</span>}
          </div>
        )}
        {!canEdit && (
          <div className="flex items-center gap-2 mt-3">
            <Button variant="secondary" onClick={share}>Share</Button>
            {msg && <span className="text-xs text-emerald-700 font-semibold">{msg}</span>}
          </div>
        )}
      </Card>

      {hidden ? (
        <Card className="p-6 text-center text-sm text-gray-500">
          Picks are hidden until the bracket locks. (Pool owner can enable public brackets.)
        </Card>
      ) : (
        <>
          <Bracket picks={picks} results={results} editable={canEdit} onPick={onPick} />
          <Card className="p-4">
            <label className="text-sm font-semibold text-emerald-900">
              Tie-breaker: total goals in the Final
            </label>
            <div className="flex gap-2 mt-2">
              <Input
                type="number" min="0" max="20" placeholder="e.g. 3"
                value={tiebreaker}
                disabled={!canEdit}
                onChange={(e) => { setTiebreaker(e.target.value); setDirty(true); }}
                className="max-w-[120px]"
              />
              {canEdit && <Button onClick={save} disabled={saving || !dirty}>Save</Button>}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
