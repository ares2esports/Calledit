import { useParams, Link } from 'react-router-dom';
import { decodeBracket } from '../lib/share';
import { useStore } from '../lib/store';
import { MATCHES, FINAL_NUM, predictedWinner, matchByNum } from '../lib/tournament';
import Bracket from '../components/Bracket';
import { Card, Badge } from '../components/Ui';

export default function SharedPage() {
  const { data } = useParams();
  const { results } = useStore();
  const decoded = decodeBracket(data);
  if (!decoded) return <Card className="p-5 text-sm text-red-600">This share link is invalid.</Card>;
  const { name, picks, tiebreaker } = decoded;
  const champ = predictedWinner(matchByNum[FINAL_NUM], picks, results);
  const picked = MATCHES.filter((m) => picks[m.num]).length;
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-emerald-900">{name}'s bracket</h1>
            {champ && <p className="text-sm mt-1">Champion: <b>{champ}</b></p>}
            {tiebreaker != null && <p className="text-xs text-gray-500">Tie-breaker (final goals): {tiebreaker}</p>}
          </div>
          <Badge>{picked}/{MATCHES.length} picks</Badge>
        </div>
        <Link to="/" className="text-xs text-emerald-700 font-semibold underline mt-2 inline-block">
          Make your own bracket →
        </Link>
      </Card>
      <Bracket picks={picks} results={results} editable={false} />
    </div>
  );
}
