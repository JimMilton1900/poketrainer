import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search } from 'lucide-react';
import { api } from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { toastError } from '../utils/toast.js';
import FormModal from '../components/FormModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Field from '../components/Field.jsx';
import Pagination from '../components/Pagination.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const LIMIT = 12;
const SORTS = [['id', 'Newest first (id)'], ['name', 'Name'], ['trainer', 'Trainer'], ['members', 'Members'],
               ['avg_level', 'Average level'], ['power', 'Total base stats']];

function TeamModal({ trainers, onClose, onCreated }) {
  const [form, setForm] = useState({ trainer_id: '', name: '' });
  const submit = async () => {
    const team = await api.post('/teams', form);
    toast.success('Team created');
    onCreated(team);
  };
  return (
    <FormModal title="New team" onClose={onClose} onSubmit={submit} submitLabel="Create team">
      <Field label="Trainer" hint="FOREIGN KEY: the trainer must exist.">
        <select className="select w-full" value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}>
          <option value="">Select a trainer...</option>
          {trainers?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </Field>
      <Field label="Team name" hint="UNIQUE (trainer, name): the same trainer can't reuse a team name.">
        <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
    </FormModal>
  );
}

export default function Teams() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [minMembers, setMinMembers] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);

  const trainers = useFetch('/trainers', { limit: 100, sort: 'name' });
  const { data, loading, error, reload } = useFetch('/teams', {
    search: q, trainer_id: trainerId, min_members: minMembers, sort, order, page, limit: LIMIT,
  });
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState(null);

  useEffect(() => {
    if (data && data.data.length === 0 && page > 1) setPage(page - 1);
  }, [data, page]);

  const f = (setter) => (v) => { setter(v); setPage(1); };

  const doDelete = async () => {
    try {
      const r = await api.del(`/teams/${del.id}`);
      toast.success(`Deleted "${del.name}" (${r.members_removed} Pokémon removed)`);
      reload();
    } catch (e) { toastError(e); }
    setDel(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-pixel text-sm">Teams</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus className="size-4" /> New team</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="input w-full sm:w-56">
          <Search className="size-4 opacity-60" />
          <input type="search" placeholder="Search team or trainer..." value={search} onChange={(e) => f(setSearch)(e.target.value)} />
        </label>
        <select className="select w-44" value={trainerId} onChange={(e) => f(setTrainerId)(e.target.value)}>
          <option value="">All trainers</option>
          {trainers.data?.data.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="select w-40" value={minMembers} onChange={(e) => f(setMinMembers)(e.target.value)}>
          <option value="">Any size</option>
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+ Pokémon</option>)}
        </select>
        <select className="select w-48" value={sort} onChange={(e) => f(setSort)(e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
        </select>
        <select className="select w-32" value={order} onChange={(e) => f(setOrder)(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data && <PokeballLoader />}

      {data && (data.data.length === 0 ? <EmptyState text="No teams found." /> : (
        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {data.data.map((t) => (
            <div key={t.id} className="card border-2 border-base-content/20 bg-base-100 transition hover:-translate-y-1">
              <Link to={`/teams/${t.id}`} className="card-body gap-2 p-4">
                <h3 className="font-pixel text-xs leading-relaxed">{t.name}</h3>
                <p className="text-sm opacity-70">Trainer: {t.trainer}</p>
                <progress className="progress progress-primary h-2" value={t.members} max="6" />
                <p className="text-xs opacity-70">
                  {t.members}/6 Pokémon · avg Lv {t.avg_level ?? '-'} · power {t.total_base_stats}
                </p>
              </Link>
              <div className="border-t border-base-content/10 px-2 py-1 text-right">
                <button className="btn btn-ghost btn-xs text-error" onClick={() => setDel(t)}><Trash2 className="size-4" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      ))}
      {data && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} />}

      {creating && <TeamModal trainers={trainers.data?.data} onClose={() => setCreating(false)}
                              onCreated={(t) => nav(`/teams/${t.id}`)} />}
      {del && (
        <ConfirmModal title={`Delete "${del.name}"?`}
          message={<>Its <b>{del.members}</b> Pokémon and their moves go with it (CASCADE). Blocked if the team appears in a battle (RESTRICT).</>}
          onConfirm={doDelete} onCancel={() => setDel(null)} />
      )}
    </div>
  );
}