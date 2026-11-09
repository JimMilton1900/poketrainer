import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useFetch } from '../hooks/useFetch.js';
import TypeBadge from '../components/TypeBadge.jsx';
import StatBar from '../components/StatBar.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { pretty, dexNo } from '../utils/format.js';
import { TYPE_HEX } from '../utils/typeColors.js';

export default function PokemonDetail() {
  const { id } = useParams();
  const { data: p, loading, error, reload } = useFetch(`/pokemon/${id}`);
  const used = useFetch('/team-members', { pokemon_id: id, limit: 50, sort: 'level', order: 'desc' });

  if (loading && !p) return <PokeballLoader />;
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert error={error} onRetry={reload} />
        <Link to="/pokedex" className="btn"><ArrowLeft className="size-4" /> Back to Pokédex</Link>
      </div>
    );
  }
  if (!p) return null;

  const stats = [['HP', p.base_hp], ['ATK', p.base_attack], ['DEF', p.base_defense],
                 ['SpA', p.base_sp_attack], ['SpD', p.base_sp_defense], ['SPE', p.base_speed]];
  const total = stats.reduce((s, [, v]) => s + v, 0);
  const color = TYPE_HEX[p.types[0]] ?? '#888';
  const num = Number(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/pokedex" className="btn btn-sm"><ArrowLeft className="size-4" /> Pokédex</Link>
        <div className="join">
          {num > 1 && <Link to={`/pokedex/${num - 1}`} className="btn btn-sm join-item"><ChevronLeft className="size-4" /></Link>}
          <Link to={`/pokedex/${num + 1}`} className="btn btn-sm join-item"><ChevronRight className="size-4" /></Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card border-2 border-base-content/20 bg-base-100">
          <figure className="py-6" style={{ backgroundColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
            {p.sprite_url && (
              <img src={p.sprite_url} alt={p.name} className="size-48 object-contain [image-rendering:pixelated]" />
            )}
          </figure>
          <div className="card-body gap-3">
            <div className="flex items-center gap-2">
              <span className="badge badge-neutral font-pixel text-[0.6rem]">{dexNo(p.id)}</span>
              <h1 className="font-pixel text-sm">{pretty(p.name)}</h1>
            </div>
            <div className="flex gap-1">{p.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="opacity-60">Height</span><br />{(p.height_dm / 10).toFixed(1)} m</div>
              <div><span className="opacity-60">Weight</span><br />{(p.weight_hg / 10).toFixed(1)} kg</div>
            </div>
          </div>
        </div>

        <div className="card border-2 border-base-content/20 bg-base-100">
          <div className="card-body">
            <h2 className="font-pixel text-xs">Base stats · total {total}</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <RadarChart data={stats.map(([stat, value]) => ({ stat, value }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="stat" tick={{ fontSize: 20 }} />
                  <PolarRadiusAxis domain={[0, 200]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">{stats.map(([l, v]) => <StatBar key={l} label={l} value={v} />)}</div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-pixel text-xs">On trainers' teams</h2>
        {used.data && used.data.data.length === 0 && <p className="text-sm opacity-60">No team uses this Pokémon yet.</p>}
        {used.data && used.data.data.length > 0 && (
          <div className="overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100">
            <table className="table table-sm">
              <thead><tr><th>Trainer</th><th>Team</th><th>Nickname</th><th>Level</th></tr></thead>
              <tbody>
                {used.data.data.map((m) => (
                  <tr key={m.id}>
                    <td><Link className="link" to={`/trainers/${m.trainer_id}`}>{m.trainer}</Link></td>
                    <td><Link className="link" to={`/teams/${m.team_id}`}>{m.team}</Link></td>
                    <td>{m.nickname ?? '-'}</td>
                    <td>{m.level}</td>
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