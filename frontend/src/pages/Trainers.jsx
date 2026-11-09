import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, ArrowDown, ArrowUp } from 'lucide-react';
import { api } from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { toastError } from '../utils/toast.js';
import { fmtDate } from '../utils/format.js';
import TypeBadge from '../components/TypeBadge.jsx';
import TypeSelect from '../components/TypeSelect.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Field from '../components/Field.jsx';
import Pagination from '../components/Pagination.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const LIMIT = 10;

// target: {} = new trainer, or an existing trainer row = edit
function TrainerModal({ target, onClose, onSaved }) {
  const editing = !!target.id;
  const [form, setForm] = useState({
    name: target.name ?? '',
    hometown: target.hometown ?? '',
    favorite_type_id: target.favorite_type_id ?? '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const saved = editing ? await api.put(`/trainers/${target.id}`, form) : await api.post('/trainers', form);
    toast.success(editing ? 'Trainer updated' : 'Trainer created');
    onSaved(saved);
  };

  return (
    <FormModal title={editing ? `Edit ${target.name}` : 'New trainer'} onClose={onClose} onSubmit={submit}
               submitLabel={editing ? 'Save changes' : 'Create trainer'}>
      <Field label="Name" hint="UNIQUE + NOT NULL: try a duplicate or an empty name.">
        <input className="input w-full" value={form.name} onChange={set('name')} />
      </Field>
      <Field label="Hometown" hint="Defaults to Pallet Town when left blank on create.">
        <input className="input w-full" value={form.hometown} onChange={set('hometown')} />
      </Field>
      <Field label="Favorite type">
        <TypeSelect valueKey="id" value={form.favorite_type_id} placeholder="None"
                    onChange={(v) => setForm({ ...form, favorite_type_id: v })} className="w-full" />
      </Field>
    </FormModal>
  );
}

export default function Trainers() {
  const [search, setSearch] = useState('');
  const [favType, setFavType] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data, loading, error, reload } = useFetch('/trainers', {
    search: q, favorite_type: favType, sort, order, page, limit: LIMIT,
  });

  const [modal, setModal] = useState(null); // null | {} | trainer
  const [del, setDel] = useState(null);

  // Editing the last item of the last page can leave an empty page: step back
  useEffect(() => {
    if (data && data.data.length === 0 && page > 1) setPage(page - 1);
  }, [data, page]);

  const toggle = (key) => {
    if (sort === key) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setOrder('asc'); }
    setPage(1);
  };
  const Th = ({ k, children }) => (
    <th className="cursor-pointer select-none whitespace-nowrap" onClick={() => toggle(k)}>
      {children}
      {sort === k && (order === 'asc' ? <ArrowUp className="ml-1 inline size-3" /> : <ArrowDown className="ml-1 inline size-3" />)}
    </th>
  );

  const doDelete = async () => {
    try {
      const r = await api.del(`/trainers/${del.id}`);
      toast.success(`Deleted ${del.name} (${r.teams_removed} team(s) removed)`);
      reload();
    } catch (e) { toastError(e); }
    setDel(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-pixel text-sm">Trainers</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>
          <Plus className="size-4" /> New trainer
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="input w-full sm:w-64">
          <Search className="size-4 opacity-60" />
          <input type="search" placeholder="Search name or hometown..." value={search}
                 onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </label>
        <TypeSelect value={favType} onChange={(v) => { setFavType(v); setPage(1); }} placeholder="Any favorite type" className="w-48" />
      </div>

      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data && <PokeballLoader />}

      {data && (data.data.length === 0 ? (
        <EmptyState text="No trainers found." />
      ) : (
        <div className={`overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100 ${loading ? 'opacity-60' : ''}`}>
          <table className="table">
            <thead>
              <tr>
                <Th k="id">#</Th><Th k="name">Name</Th><Th k="hometown">Hometown</Th>
                <th>Favorite</th><Th k="teams">Teams</Th><Th k="joined">Joined</Th><th />
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t.id} className="hover:bg-base-200">
                  <td className="opacity-60">{t.id}</td>
                  <td><Link className="link font-semibold" to={`/trainers/${t.id}`}>{t.name}</Link></td>
                  <td>{t.hometown}</td>
                  <td>{t.favorite_type ? <TypeBadge type={t.favorite_type} /> : <span className="opacity-40">-</span>}</td>
                  <td>{t.team_count}</td>
                  <td className="whitespace-nowrap">{fmtDate(t.joined_at)}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="btn btn-ghost btn-xs" onClick={() => setModal(t)} aria-label="Edit"><Pencil className="size-4" /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => setDel(t)} aria-label="Delete"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} />}

      {modal && <TrainerModal target={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {del && (
        <ConfirmModal
          title={`Delete ${del.name}?`}
          message={<>This also deletes their <b>{del.team_count}</b> team(s), those teams' Pokémon and moves (ON DELETE CASCADE). It is blocked if any of their teams has battle history (RESTRICT).</>}
          onConfirm={doDelete} onCancel={() => setDel(null)} />
      )}
    </div>
  );
}