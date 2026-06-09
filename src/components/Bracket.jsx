import { useState } from 'react';
import { ROUNDS, matchesInRound, resolveTeam, matchByNum } from '../lib/tournament';
import { actualWinner } from '../lib/scoring';
import { Card } from './Ui';

function TeamButton({ name, picked, correct, wrong, editable, onClick }) {
  const known = !!name;
  return (
    <button
      disabled={!editable}
      onClick={onClick}
      className={`flex-1 px-3 py-3 rounded-xl border text-sm font-semibold transition active:scale-[.98] text-left
        ${picked ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-emerald-200 text-gray-800'}
        ${!editable && !picked ? 'opacity-70' : ''}
        ${correct ? 'ring-2 ring-green-500' : ''} ${wrong ? 'ring-2 ring-red-400 opacity-80' : ''}`}
    >
      <span className={known ? '' : 'text-gray-400 font-normal'}>{name || 'TBD'}</span>
      {correct && <span className="ml-1">✓</span>}
      {wrong && <span className="ml-1">✗</span>}
    </button>
  );
}

function MatchCard({ match, picks, results, editable, onPick }) {
  const t1 = resolveTeam(match, 'team1', picks, results);
  const t2 = resolveTeam(match, 'team2', picks, results);
  const pick = picks?.[match.num];
  const actual = actualWinner(match.num, results);
  const predicted = pick ? (pick === 'team1' ? t1 : t2) : null;
  const decided = !!actual;
  const r = results?.matches?.[match.num];

  const upstreamLabel = (side) => {
    const slot = match[side];
    if (slot.type === 'winner') return `Winner of M${slot.match}`;
    return slot.label;
  };

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
        <span>Match {match.num} · {match.venue}</span>
        <span>{match.date}</span>
      </div>
      <div className="flex gap-2">
        <TeamButton
          name={t1 || upstreamLabel('team1')}
          picked={pick === 'team1'}
          correct={decided && pick === 'team1' && predicted === actual}
          wrong={decided && pick === 'team1' && predicted !== actual}
          editable={editable}
          onClick={() => onPick(match.num, 'team1')}
        />
        <div className="grid place-items-center text-xs text-gray-400 font-bold">vs</div>
        <TeamButton
          name={t2 || upstreamLabel('team2')}
          picked={pick === 'team2'}
          correct={decided && pick === 'team2' && predicted === actual}
          wrong={decided && pick === 'team2' && predicted !== actual}
          editable={editable}
          onClick={() => onPick(match.num, 'team2')}
        />
      </div>
      {decided && r && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          Final: {r.team1} {r.score1}–{r.score2} {r.team2}
        </div>
      )}
    </Card>
  );
}

export default function Bracket({ picks, results, editable = false, onPick = () => {} }) {
  const [round, setRound] = useState('R32');
  const pickedInRound = (key) => matchesInRound(key).filter((m) => picks?.[m.num]).length;
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {ROUNDS.map((r) => {
          const total = matchesInRound(r.key).length;
          const done = pickedInRound(r.key);
          return (
            <button
              key={r.key}
              onClick={() => setRound(r.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition
                ${round === r.key ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}
            >
              {r.label} {done}/{total}
            </button>
          );
        })}
      </div>
      <div className="space-y-3 mt-2">
        {matchesInRound(round).map((m) => (
          <MatchCard key={m.num} match={m} picks={picks} results={results} editable={editable} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}
