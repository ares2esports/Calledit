// FIFA World Cup 2026 — real draw + official knockout structure (matches 73–104)

export const GROUPS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

export const ROUNDS = [
  { key: 'R32', label: 'Round of 32' },
  { key: 'R16', label: 'Round of 16' },
  { key: 'QF', label: 'Quarter-finals' },
  { key: 'SF', label: 'Semi-finals' },
  { key: 'F', label: 'Final' },
];

export const DEFAULT_SCORING = { R32: 1, R16: 2, QF: 4, SF: 6, F: 10, champBonus: 5 };

// First Round-of-32 kickoff (June 28, 2026 12:00 PT)
export const DEFAULT_LOCK_AT = '2026-06-28T19:00:00Z';

const g = (s) => ({ type: 'slot', label: s }); // group-stage slot e.g. "1A", "2B", "3A/B/C/D/F"
const w = (n) => ({ type: 'winner', match: n });

export const MATCHES = [
  { num: 73, round: 'R32', date: '2026-06-28', venue: 'Los Angeles', team1: g('2A'), team2: g('2B') },
  { num: 74, round: 'R32', date: '2026-06-29', venue: 'Boston', team1: g('1E'), team2: g('3A/B/C/D/F') },
  { num: 75, round: 'R32', date: '2026-06-29', venue: 'Monterrey', team1: g('1F'), team2: g('2C') },
  { num: 76, round: 'R32', date: '2026-06-29', venue: 'Houston', team1: g('1C'), team2: g('2F') },
  { num: 77, round: 'R32', date: '2026-06-30', venue: 'New York/NJ', team1: g('1I'), team2: g('3C/D/F/G/H') },
  { num: 78, round: 'R32', date: '2026-06-30', venue: 'Dallas', team1: g('2E'), team2: g('2I') },
  { num: 79, round: 'R32', date: '2026-06-30', venue: 'Mexico City', team1: g('1A'), team2: g('3C/E/F/H/I') },
  { num: 80, round: 'R32', date: '2026-07-01', venue: 'Atlanta', team1: g('1L'), team2: g('3E/H/I/J/K') },
  { num: 81, round: 'R32', date: '2026-07-01', venue: 'San Francisco', team1: g('1D'), team2: g('3B/E/F/I/J') },
  { num: 82, round: 'R32', date: '2026-07-01', venue: 'Seattle', team1: g('1G'), team2: g('3A/E/H/I/J') },
  { num: 83, round: 'R32', date: '2026-07-02', venue: 'Toronto', team1: g('2K'), team2: g('2L') },
  { num: 84, round: 'R32', date: '2026-07-02', venue: 'Los Angeles', team1: g('1H'), team2: g('2J') },
  { num: 85, round: 'R32', date: '2026-07-02', venue: 'Vancouver', team1: g('1B'), team2: g('3E/F/G/I/J') },
  { num: 86, round: 'R32', date: '2026-07-03', venue: 'Miami', team1: g('1J'), team2: g('2H') },
  { num: 87, round: 'R32', date: '2026-07-03', venue: 'Kansas City', team1: g('1K'), team2: g('3D/E/I/J/L') },
  { num: 88, round: 'R32', date: '2026-07-03', venue: 'Dallas', team1: g('2D'), team2: g('2G') },
  { num: 89, round: 'R16', date: '2026-07-04', venue: 'Philadelphia', team1: w(74), team2: w(77) },
  { num: 90, round: 'R16', date: '2026-07-04', venue: 'Houston', team1: w(73), team2: w(75) },
  { num: 91, round: 'R16', date: '2026-07-05', venue: 'New York/NJ', team1: w(76), team2: w(78) },
  { num: 92, round: 'R16', date: '2026-07-05', venue: 'Mexico City', team1: w(79), team2: w(80) },
  { num: 93, round: 'R16', date: '2026-07-06', venue: 'Dallas', team1: w(83), team2: w(84) },
  { num: 94, round: 'R16', date: '2026-07-06', venue: 'Seattle', team1: w(81), team2: w(82) },
  { num: 95, round: 'R16', date: '2026-07-07', venue: 'Atlanta', team1: w(86), team2: w(88) },
  { num: 96, round: 'R16', date: '2026-07-07', venue: 'Vancouver', team1: w(85), team2: w(87) },
  { num: 97, round: 'QF', date: '2026-07-09', venue: 'Boston', team1: w(89), team2: w(90) },
  { num: 98, round: 'QF', date: '2026-07-10', venue: 'Los Angeles', team1: w(93), team2: w(94) },
  { num: 99, round: 'QF', date: '2026-07-11', venue: 'Miami', team1: w(91), team2: w(92) },
  { num: 100, round: 'QF', date: '2026-07-11', venue: 'Kansas City', team1: w(95), team2: w(96) },
  { num: 101, round: 'SF', date: '2026-07-14', venue: 'Dallas', team1: w(97), team2: w(98) },
  { num: 102, round: 'SF', date: '2026-07-15', venue: 'Atlanta', team1: w(99), team2: w(100) },
  { num: 104, round: 'F', date: '2026-07-19', venue: 'New York/NJ', team1: w(101), team2: w(102) },
];

export const FINAL_NUM = 104;
export const matchByNum = Object.fromEntries(MATCHES.map((m) => [m.num, m]));
export const matchesInRound = (key) => MATCHES.filter((m) => m.round === key);

// Resolve the team name a user has flowing into `side` of `match`,
// given their picks. Falls back to the actual R32 team (from results)
// or the slot placeholder when unknown.
export function resolveTeam(match, side, picks, results) {
  const slot = match[side];
  if (slot.type === 'slot') {
    const actual = results?.matches?.[match.num]?.[side];
    return actual || slot.label;
  }
  // winner of a previous match, per the user's picks
  const prev = matchByNum[slot.match];
  const pick = picks?.[slot.match];
  if (!pick) return null;
  return resolveTeam(prev, pick, picks, results);
}

// Resolve the user's predicted winner (team name) of a match
export function predictedWinner(match, picks, results) {
  const pick = picks?.[match.num];
  if (!pick) return null;
  return resolveTeam(match, pick, picks, results);
}

// True if a team label is still a placeholder like "1A" or "3C/E/F/H/I"
export const isPlaceholder = (name) =>
  !name || /^[123][A-L](\/[A-L])*$/.test(name) || /^[WL]\d+$/.test(name);

export function picksComplete(picks) {
  return MATCHES.every((m) => picks?.[m.num]);
}
