import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import PokemonCard from '../components/PokemonCard.jsx';
import TypeSelect from '../components/TypeSelect.jsx';
import Pagination from '../components/Pagination.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const SORTS = [['id', 'Number'], ['name', 'Name'], ['total', 'Total stats'], ['hp', 'HP'],
               ['attack', 'Attack'], ['defense', 'Defense'], ['speed', 'Speed']];
const LIMIT = 24;

export default function Pokedex() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);

  const { data, loading, error, reload } = useFetch('/pokemon', { search: q, type, sort, order, page, limit: LIMIT });
  const f = (setter) => (v) => { setter(v); setPage(1); }; // any filter change returns to page 1

  return (
    <div>
      <h1 className="mb-4 font-pixel text-sm">Pokédex</h1>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label className="input w-full sm:w-64">
          <Search className="size-4 opacity-60" />
          <input type="search" placeholder="Search by name..." value={search}
                 onChange={(e) => f(setSearch)(e.target.value)} />
        </label>
        <TypeSelect value={type} onChange={f(setType)} className="w-40" />
        <select className="select w-40" value={sort} onChange={(e) => f(setSort)(e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
        </select>
        <button className="btn btn-square" title="Toggle order"
                onClick={() => f(setOrder)(order === 'asc' ? 'desc' : 'asc')}>
          <ArrowUpDown className="size-4" />
        </button>
        <span className="text-xs uppercase opacity-60">{order === 'asc' ? 'Ascending' : 'Descending'}</span>
      </div>

      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data && <PokeballLoader />}

      {data && (data.data.length === 0 ? (
        <EmptyState text="No Pokémon match those filters." />
      ) : (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${loading ? 'opacity-50' : ''}`}>
          {data.data.map((p) => (
            <Link key={p.id} to={`/pokedex/${p.id}`} className="block">
              <PokemonCard pokemon={p} />
            </Link>
          ))}
        </div>
      ))}

      {data && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} />}
    </div>
  );
}