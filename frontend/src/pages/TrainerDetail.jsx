import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import TypeBadge from '../components/TypeBadge.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fmtDate, fmtDateTime } from '../utils/format.js';

export default function TrainerDetail() {
  const { id } = useParams();
  const { data: t, loading, error, reload } = useFetch(`/trainers/${id}`);
  const battles = useFetch('/battles', { trainer_id: id, sort: 'date', order: 'desc', limit: 8 });

  if (loading && !t) return <PokeballLoader />;
  if (error) return <div className="space-y-4"><ErrorAlert error={error} onRetry={reload} /><Link to="/trainers" className="btn">Back</Link></div>;
  if (!t) return null;

  return (
    <div className="space-y-6">
      <Link to="/trainers" className="btn btn-sm"><ArrowLeft className="size-4" /> Trainers</Link>

      <div className="card border-4 border-neutral bg-base-100">
        <div className="flex items-center gap-4 bg-primary p-4 text-primary-content">
          <div className="pokeball size-12 shrink-0" />
          <div>
            <p className="font-pixel text-[0.55rem] opacity-80">TRAINER CARD · ID {String(t.id).padStart(5, '0')}</p>
            <h1 className="font-pixel text-sm">{t.name}</h1>
          </div>
        </div>
        <div className="grid gap-3 p-4 text-sm sm:grid-cols-4">
          <div><span className="opacity-60">Hometown</span><br />{t.hometown}</div>
          <div><span className="opacity-60">Favorite type</span><br />{t.favorite_type ? <TypeBadge type={t.favorite_type} /> : '-'}</div>
          <div><span className="opacity-60">Joined</span><br />{fmtDate(t.joined_at)}</div>
          <div><span className="opacity-60">Teams</span><br />{t.team_count}</div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-pixel text-xs">Teams</h2>
        {t.teams.length === 0 ? <EmptyState text="This trainer has no teams yet." /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.teams.map((tm) => (
              <Link key={tm.team_id} to={`/teams/${tm.team_id}`}
                    className="card border-2 border-base-content/20 bg-base-100 p-4 transition hover:-translate-y-1">
                <h3 className="font-pixel text-xs">{tm.team_name}</h3>
                <p className="mt-2 text-sm opacity-70">
                  {tm.members}/6 Pokémon · avg Lv {tm.avg_level ?? '-'} · power {tm.total_base_stats}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-pixel text-xs">Recent battles</h2>
        {battles.data && battles.data.data.length === 0 && <p className="text-sm opacity-60">No battles recorded.</p>}
        {battles.data && battles.data.data.length > 0 && (
          <div className="overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100">
            <table className="table table-sm">
              <thead><tr><th>Date</th><th>Matchup</th><th>Winner</th></tr></thead>
              <tbody>
                {battles.data.data.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap">{fmtDateTime(b.battled_at)}</td>
                    <td>{b.team1} ({b.trainer1}) vs {b.team2} ({b.trainer2})</td>
                    <td><Trophy className="mr-1 inline size-4 text-warning" />{b.winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}