import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { api } from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { toastError } from '../utils/toast.js';
import { fmtDateTime } from '../utils/format.js';
import FormModal from '../components/FormModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Field from '../components/Field.jsx';
import Pagination from '../components/Pagination.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const LIMIT = 10;

function BattleModal({ target, teams, onClose, onSaved }) {
  const editing = !!target.id;
  const [form, setForm] = useState({
    team1_id: target.team1_id ?? '', team2_id: target.team2_id ?? '', winner_team_id: target.winner_team_id ?? '',
  });
  const label = (t) => `${t.name} (${t.trainer})`;

  // Changing a team resets the winner if it is no longer one of the two
  const change = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    if (![next.team1_id, next.team2_id].map(String).includes(String(next.winner_team_id))) next.winner_team_id = '';
    setForm(next);
  };
  const contenders = [form.team1_id, form.team2_id]
    .filter((v, i, a) => v !== '' && a.indexOf(v) === i)
    .map((v) => teams?.find((t) => String(t.id) === String(v)))
    .filter(Boolean);

  const submit = async () => {
    editing ? await api.put(`/battles/${target.id}`, form) : await api.post('/battles', form);
    toast.success(editing ? 'Battle updated' : 'Battle recorded');
    onSaved();
  };

  const TeamSelect = ({ k, placeholder }) => (
    <select className="select w-full" value={form[k]} onChange={change(k)}>
      <option value="">{placeholder}</option>
      {teams?.map((t) => <option key={t.id} value={t.id}>{label(t)}</option>)}
    </select>
  );

  return (
    <FormModal title={editing ? `Edit battle #${target.id}` : 'Record a battle'} onClose={onClose} onSubmit={submit}
               submitLabel={editing ? 'Save changes' : 'Record battle'}>
      <Field label="Team 1"><TeamSelect k="team1_id" placeholder="Select a team..." /></Field>
      <Field label="Team 2" hint="CHECK: a team can't battle itself. Pick the same team twice to see MySQL refuse it.">
        <TeamSelect k="team2_id" placeholder="Select a team..." />
      </Field>
      <Field label="Winner" hint="CHECK: must be one of the two teams (the list only offers them).">
        <select className="select w-full" value={form.winner_team_id} onChange={(e) => setForm({ ...form, winner_team_id: e.target.value })}>
          <option value="">Select the winner...</option>
          {contenders.map((t) => <option key={t.id} value={t.id}>{label(t)}</option>)}
        </select>
      </Field>
    </FormModal>
  );
}

export default function Battles() {
  const [trainerId, setTrainerId] = useState('');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const trainers = useFetch('/trainers', { limit: 100, sort: 'name' });
  const teams = useFetch('/teams', { limit: 100, sort: 'name' });
  const { data, loading, error, reload } = useFetch('/battles', {
    trainer_id: trainerId, sort: 'date', order, page, limit: LIMIT,
  });
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  useEffect(() => {
    if (data && data.data.length === 0 && page > 1) setPage(page - 1);
  }, [data, page]);

  const doDelete = async () => {
    try { await api.del(`/battles/${del.id}`); toast.success('Battle deleted'); reload(); }
    catch (e) { toastError(e); }
    setDel(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-pixel text-sm">Battle log</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}><Plus className="size-4" /> Record battle</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select className="select w-48" value={trainerId} onChange={(e) => { setTrainerId(e.target.value); setPage(1); }}>
          <option value="">All trainers</option>
          {trainers.data?.data.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="select w-40" value={order} onChange={(e) => { setOrder(e.target.value); setPage(1); }}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data && <PokeballLoader />}

      {data && (data.data.length === 0 ? <EmptyState text="No battles recorded." /> : (
        <div className={`overflow-x-auto rounded-box border-2 border-base-content/20 bg-base-100 ${loading ? 'opacity-60' : ''}`}>
          <table className="table">
            <thead><tr><th>#</th><th>Date</th><th>Team 1</th><th>Team 2</th><th>Winner</th><th /></tr></thead>
            <tbody>
              {data.data.map((b) => (
                <tr key={b.id}>
                  <td className="opacity-60">{b.id}</td>
                  <td className="whitespace-nowrap">{fmtDateTime(b.battled_at)}</td>
                  <td><Link className="link" to={`/teams/${b.team1_id}`}>{b.team1}</Link><div className="text-xs opacity-60">{b.trainer1}</div></td>
                  <td><Link className="link" to={`/teams/${b.team2_id}`}>{b.team2}</Link><div className="text-xs opacity-60">{b.trainer2}</div></td>
                  <td className="font-semibold"><Trophy className="mr-1 inline size-4 text-warning" />{b.winner}<div className="text-xs font-normal opacity-60">{b.winner_trainer}</div></td>
                  <td className="whitespace-nowrap text-right">
                    <button className="btn btn-ghost btn-xs" onClick={() => setModal(b)} aria-label="Edit"><Pencil className="size-4" /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => setDel(b)} aria-label="Delete"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {data && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} />}

      {modal && <BattleModal target={modal} teams={teams.data?.data} onClose={() => setModal(null)}
                             onSaved={() => { setModal(null); reload(); }} />}
      {del && <ConfirmModal title={`Delete battle #${del.id}?`}
                message={<>{del.team1} vs {del.team2}. This only removes the battle record.</>}
                onConfirm={doDelete} onCancel={() => setDel(null)} />}
    </div>
  );
}