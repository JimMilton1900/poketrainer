import { useFetch } from '../hooks/useFetch.js';
import PokemonCard from '../components/PokemonCard.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { Link } from 'react-router-dom';
import { pretty } from '../utils/format.js';

const SHOWN = ['pokemon', 'moves', 'trainers', 'teams', 'team_members', 'battles'];

export default function Dashboard() {
  const stats = useFetch('/stats');
  const sample = useFetch('/pokemon', { limit: 8, sort: 'total', order: 'desc' });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 font-pixel text-sm">Dashboard</h1>
        {stats.loading && <PokeballLoader label="Loading stats..." />}
        <ErrorAlert error={stats.error} onRetry={stats.reload} />
        {stats.data && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {SHOWN.map((k) => (
              <div key={k} className="rounded-box border-2 border-base-content/20 bg-base-100 p-4">
                <div className="text-xs uppercase opacity-60">{pretty(k)}</div>
                <div className="font-pixel text-lg text-primary">{stats.data[k]}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-pixel text-xs">Strongest by base stat total</h2>
        {sample.loading && <PokeballLoader />}
        <ErrorAlert error={sample.error} onRetry={sample.reload} />
        {sample.data && (
        
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sample.data.data.map((p) => <Link key={p.id} to={`/pokedex/${p.id}`} className="block">
                    <PokemonCard key={p.id} pokemon={p} /> </Link>
            )}
          </div>
    
        
        )}
      </section>
    </div>
  );
}