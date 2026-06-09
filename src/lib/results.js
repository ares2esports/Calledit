import { RESULTS_URL } from '../config';
import { MATCHES, isPlaceholder } from './tournament';

// Parse the openfootball worldcup.json feed into our results shape:
// { matches: { [num]: { team1, team2, score1, score2, winner } }, fetchedAt }
export function parseFeed(json) {
  const out = {};
  const rows = json?.matches || [];
  const knockout = new Set(MATCHES.map((m) => m.num));
  for (const row of rows) {
    let num = row.num;
    if (num == null) {
      if (/final/i.test(row.round || '') && !/semi|quarter/i.test(row.round || '')) num = 104;
      else if (/third/i.test(row.round || '')) num = 103;
    }
    if (!knockout.has(num) && num !== 103) continue;

    const name = (t) => (typeof t === 'string' ? t : t?.name) || null;
    const team1 = name(row.team1);
    const team2 = name(row.team2);

    // Scores: support flat (score1/score2 + et/p) and nested ({score:{ft,et,p}}) formats
    const ft1 = row.score1 ?? row.score?.ft?.[0] ?? null;
    const ft2 = row.score2 ?? row.score?.ft?.[1] ?? null;
    const et1 = row.score1et ?? row.score?.et?.[0] ?? null;
    const et2 = row.score2et ?? row.score?.et?.[1] ?? null;
    const p1 = row.score1p ?? row.score?.p?.[0] ?? null;
    const p2 = row.score2p ?? row.score?.p?.[1] ?? null;

    let winner = null;
    if (row.winner === 1 || row.winner === '1') winner = 'team1';
    else if (row.winner === 2 || row.winner === '2') winner = 'team2';
    else if (p1 != null && p2 != null) winner = p1 > p2 ? 'team1' : 'team2';
    else if (et1 != null && et2 != null && et1 !== et2) winner = et1 > et2 ? 'team1' : 'team2';
    else if (ft1 != null && ft2 != null && ft1 !== ft2) winner = ft1 > ft2 ? 'team1' : 'team2';

    const s1 = et1 ?? ft1;
    const s2 = et2 ?? ft2;
    out[num] = {
      team1: isPlaceholder(team1) ? null : team1,
      team2: isPlaceholder(team2) ? null : team2,
      score1: s1,
      score2: s2,
      winner,
    };
  }
  return { matches: out, fetchedAt: new Date().toISOString() };
}

export async function fetchResults() {
  const res = await fetch(RESULTS_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Results feed error (${res.status})`);
  return parseFeed(await res.json());
}
