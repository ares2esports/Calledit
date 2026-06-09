import { MATCHES, FINAL_NUM, predictedWinner, DEFAULT_SCORING } from './tournament';

// Actual winner team name for a finished match, else null
export function actualWinner(num, results) {
  const r = results?.matches?.[num];
  if (!r || !r.winner) return null;
  return r[r.winner] || null;
}

// Score one bracket against results. Returns { total, correct, perRound, tiebreakDiff }
export function scoreBracket(picks, tiebreaker, results, scoring = DEFAULT_SCORING) {
  const perRound = { R32: 0, R16: 0, QF: 0, SF: 0, F: 0 };
  let total = 0;
  let correct = 0;
  for (const m of MATCHES) {
    const actual = actualWinner(m.num, results);
    if (!actual) continue;
    const predicted = predictedWinner(m, picks, results);
    if (predicted && predicted === actual) {
      const pts = scoring[m.round] ?? 0;
      perRound[m.round] += pts;
      total += pts;
      correct += 1;
      if (m.num === FINAL_NUM) total += scoring.champBonus ?? 0;
    }
  }
  // Tie-breaker: distance from actual total goals in the final (lower wins)
  let tiebreakDiff = null;
  const f = results?.matches?.[FINAL_NUM];
  if (f && f.score1 != null && f.score2 != null && tiebreaker != null) {
    tiebreakDiff = Math.abs(f.score1 + f.score2 - tiebreaker);
  }
  return { total, correct, perRound, tiebreakDiff };
}

// Rank members: points desc, tiebreak diff asc, earlier submission first
export function rankMembers(members, brackets, results, scoring) {
  const rows = members.map((mem) => {
    const b = brackets[mem.id] || {};
    const s = scoreBracket(b.picks, b.tiebreaker, results, scoring);
    return { ...mem, ...s, hasPicks: !!b.picks && Object.keys(b.picks).length > 0, updatedAt: b.updatedAt };
  });
  rows.sort((a, b) =>
    b.total - a.total ||
    (a.tiebreakDiff ?? 1e9) - (b.tiebreakDiff ?? 1e9) ||
    new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
  );
  let rank = 0, prevKey = null;
  rows.forEach((r, i) => {
    const key = `${r.total}|${r.tiebreakDiff}`;
    if (key !== prevKey) { rank = i + 1; prevKey = key; }
    r.rank = rank;
  });
  return rows;
}
