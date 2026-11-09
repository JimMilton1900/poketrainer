import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Trash2, Plus, Swords } from 'lucide-react';
import Pagination from '../components/Pagination.jsx';
import { api } from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { toastError } from '../utils/toast.js';
import { pretty, dexNo } from '../utils/format.js';
import TypeBadge from '../components/TypeBadge.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Field from '../components/Field.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

const noEnter = (e) => e.key === 'Enter' && e.preventDefault(); // keep search boxes from submitting the form

/* ---------- Rename team ---------- */
function RenameModal({ team, onClose, onSaved }) {
  const [name, setName] = useState(team.name);
  const submit = async () => {
    await api.put(`/teams/${team.id}`, { name });
    toast.success('Team renamed');
    onSaved();
  };
  return (
    <FormModal title="Rename team" onClose={onClose} onSubmit={submit}>
      <Field label="Team name"><input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} /></Field>
    </FormModal>
  );
}

/* ---------- Add a Pokémon to an empty slot ---------- */
function AddMemberModal({ teamId, slot, onClose, onSaved }) {
  const [page , setPage] = useState(1)
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const list = useFetch('/pokemon', { search: q, limit: 12 , page:page });
  const [chosen, setChosen] = useState(null);
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('50');

  const submit = async () => {
    await api.post('/team-members', { team_id: teamId, pokemon_id: chosen.id, slot, nickname, level });
    toast.success(`${pretty(chosen.name)} joined slot ${slot}`);
    onSaved();
  };

  return (
    <FormModal title={`Add a Pokémon to slot ${slot}`} onClose={onClose} onSubmit={submit}
               submitLabel="Add to team" submitDisabled={!chosen} wide>
      {!chosen ? (
        <>
          <input className="input w-full" placeholder="Search Pokémon..." value={search} autoFocus
                 onChange={(e) => setSearch(e.target.value)} onKeyDown={noEnter} />
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {list.data?.data.map((p) => (
              <button type="button" key={p.id} onClick={() => setChosen(p)}
                      className="flex flex-col items-center rounded-box border-2 border-base-content/20 p-2 text-xs hover:border-primary">
                <img src={p.sprite_url} alt="" className="size-16 [image-rendering:pixelated]" />
                <span className="opacity-60">{dexNo(p.id)}</span>
                <span className="font-semibold">{pretty(p.name)}</span>
              </button>
            ))}
            
          </div>
          {list.data?.data.length === 0 && <p className="text-sm opacity-60">No match.</p>}
          {list.data && <Pagination page={page} limit={10} total={list.data.total} onPage={setPage} />}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-box bg-base-200 p-3">
            <img src={chosen.sprite_url} alt="" className="size-16 [image-rendering:pixelated]" />
            <div className="flex-1">
              <p className="font-pixel text-xs">{pretty(chosen.name)}</p>
              <div className="mt-1 flex gap-1">{chosen.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
            </div>
            <button type="button" className="btn btn-sm" onClick={() => setChosen(null)}>Change</button>
          </div>
          <Field label="Nickname (optional)">
            <input className="input w-full" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </Field>
          <Field label="Level" hint="CHECK: 1 to 100. Try 101.">
            <input type="number" className="input w-full" value={level} onChange={(e) => setLevel(e.target.value)} />
          </Field>
        </>
      )}
    </FormModal>
  );
}

/* ---------- Edit nickname / level / slot ---------- */
function EditMemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({ nickname: member.nickname ?? '', level: member.level, slot: member.slot });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    await api.put(`/team-members/${member.id}`, form);
    toast.success('Pokémon updated');
    onSaved();
  };
  return (
    <FormModal title={`Edit ${pretty(member.pokemon)}`} onClose={onClose} onSubmit={submit}>
      <Field label="Nickname" hint="Clear it to remove the nickname (stored as NULL).">
        <input className="input w-full" value={form.nickname} onChange={set('nickname')} />
      </Field>
      <Field label="Level" hint="CHECK: 1 to 100."><input type="number" className="input w-full" value={form.level} onChange={set('level')} /></Field>
      <Field label="Slot" hint="CHECK 1 to 6, and UNIQUE per team: moving into an occupied slot is rejected.">
        <input type="number" className="input w-full" value={form.slot} onChange={set('slot')} />
      </Field>
    </FormModal>
  );
}

/* ---------- Moveset editor ---------- */
function MovesModal({ member, onClose, onSaved }) {
    const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(member.moves.map((m) => ({ id: m.move_id, name: m.name, type: m.type })));
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const list = useFetch('/moves', { search: q, limit: 10, sort: 'name' , page: page});

  const add = (m) => !selected.some((s) => s.id === m.id) && setSelected([...selected, { id: m.id, name: m.name, type: m.type }]);
  const remove = (id) => setSelected(selected.filter((s) => s.id !== id));

  const submit = async () => {
    await api.put(`/team-members/${member.id}/moves`, { move_ids: selected.map((s) => s.id) });
    toast.success('Moveset saved');
    onSaved();
  };

  return (
    <FormModal title={`Moves for ${member.nickname || pretty(member.pokemon)}`} onClose={onClose} onSubmit={submit} submitLabel="Save moveset" wide>
      <div>
        <p className={`mb-2 text-xs font-semibold uppercase ${selected.length > 4 ? 'text-error' : 'opacity-70'}`}>
          Selected {selected.length}/4 {selected.length > 4 && '(CHECK will reject this)'}
        </p>
        <div className="flex min-h-10 flex-wrap gap-2">
          {selected.length === 0 && <span className="text-sm opacity-50">No moves yet.</span>}
          {selected.map((s, i) => (
            <button type="button" key={s.id} onClick={() => remove(s.id)} title="Click to remove"
                    className="badge h-8 gap-1 border-0 text-white"
                    style={{ backgroundColor: `var(--color-type-${s.type})`, textShadow: '0 1px 1px rgb(0 0 0 / .45)' }}>
              {i + 1}. {pretty(s.name)} ✕
            </button>
          ))}
        </div>
      </div>
      <input className="input w-full" placeholder="Search moves..." value={search}
             onChange={(e) => setSearch(e.target.value)} onKeyDown={noEnter} />
      <div className="max-h-60 divide-y divide-base-content/10 overflow-y-auto rounded-box border border-base-content/20">
        {list.data?.data.map((m) => (
          <button type="button" key={m.id} onClick={() => add(m)} disabled={selected.some((s) => s.id === m.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 disabled:opacity-40">
            <span className="flex-1 font-semibold">{pretty(m.name)}</span>
            <TypeBadge type={m.type} />
            <span className="w-24 text-right text-xs opacity-70">Pow {m.power ?? '-'} · PP {m.pp}{m.accuracy != null ? ` · Accuracy ${m.accuracy}` : ''}</span>
          </button>
        ))}
        {list.data?.data.length === 0 && <p className="p-3 text-sm opacity-60">No moves match.</p>}
        {list.data && <Pagination page={page} limit={10} total={list.data.total} onPage={setPage} />}
      </div>
    </FormModal>
  );
}

/* ---------- One party slot ---------- */
function MemberCard({ m, onEdit, onMoves, onRelease }) {
  const main = m.types[0] ?? 'normal';
  return (
    <div className="card border-2 border-base-content/20 bg-base-100">
      <div className="flex items-center gap-3 p-3" style={{ backgroundColor: `color-mix(in srgb, var(--color-type-${main}) 30%, transparent)` }}>
        <span className="badge badge-neutral font-pixel text-[0.55rem]">{m.slot}</span>
        <img src={m.sprite_url} alt={m.pokemon} className="size-16 [image-rendering:pixelated]" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-pixel text-[0.65rem]">{m.nickname || pretty(m.pokemon)}</p>
          {m.nickname && <p className="text-xs opacity-70">{pretty(m.pokemon)}</p>}
          <div className="mt-1 flex gap-1">{m.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
        </div>
        <div className="text-right">
          <div className="text-[0.6rem] uppercase opacity-60">Lv</div>
          <div className="font-pixel text-sm">{m.level}</div>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex min-h-6 flex-wrap gap-1">
          {m.moves.length === 0 && <span className="text-xs opacity-50">No moves set</span>}
          {m.moves.map((mv) => (
            <span key={mv.move_id} className="badge badge-sm border-0 text-white"
                  style={{ backgroundColor: `var(--color-type-${mv.type})`, textShadow: '0 1px 1px rgb(0 0 0 / .45)' }}>
              {pretty(mv.name)}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <button className="btn btn-xs" onClick={onEdit}><Pencil className="size-3" /> Edit</button>
          <button className="btn btn-xs" onClick={onMoves}><Swords className="size-3" /> Moves</button>
          <button className="btn btn-xs btn-ghost ml-auto text-error" onClick={onRelease}><Trash2 className="size-3" /> Release</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function TeamDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: team, loading, error, reload } = useFetch(`/teams/${id}`);

  const [adding, setAdding] = useState(null);   // slot number
  const [editing, setEditing] = useState(null); // member
  const [moving, setMoving] = useState(null);   // member
  const [release, setRelease] = useState(null); // member
  const [renaming, setRenaming] = useState(false);
  const [delTeam, setDelTeam] = useState(false);

  if (loading && !team) return <PokeballLoader />;
  if (error) return <div className="space-y-4"><ErrorAlert error={error} onRetry={reload} /><Link to="/teams" className="btn">Back</Link></div>;
  if (!team) return null;

  const bySlot = Object.fromEntries(team.party.map((m) => [m.slot, m]));
  const saved = (setter) => () => { setter(null); reload(); };

  const doRelease = async () => {
    try {
      await api.del(`/team-members/${release.id}`);
      toast.success(`${pretty(release.pokemon)} was released`);
      reload();
    } catch (e) { toastError(e); }
    setRelease(null);
  };
  const doDeleteTeam = async () => {
    try {
      await api.del(`/teams/${team.id}`);
      toast.success('Team deleted');
      nav('/teams');
    } catch (e) { toastError(e); setDelTeam(false); }
  };

  return (
    <div className="space-y-6">
      <Link to="/teams" className="btn btn-sm"><ArrowLeft className="size-4" /> Teams</Link>

      <div className="flex flex-wrap items-center gap-4 rounded-box border-2 border-base-content/20 bg-base-100 p-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-pixel text-sm">{team.name}</h1>
          <p className="mt-1 text-sm opacity-70">
            Trainer: <Link className="link" to={`/trainers/${team.trainer_id}`}>{team.trainer}</Link>
          </p>
        </div>
        <div className="stats border border-base-content/20 text-center">
          <div className="stat px-4 py-2"><div className="stat-title text-xs">Party</div><div className="stat-value font-pixel text-base">{team.members}/6</div></div>
          <div className="stat px-4 py-2"><div className="stat-title text-xs">Avg level</div><div className="stat-value font-pixel text-base">{team.avg_level ?? '-'}</div></div>
          <div className="stat px-4 py-2"><div className="stat-title text-xs">Power</div><div className="stat-value font-pixel text-base">{team.total_base_stats}</div></div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setRenaming(true)}><Pencil className="size-4" /> Rename</button>
          <button className="btn btn-sm btn-error btn-outline" onClick={() => setDelTeam(true)}><Trash2 className="size-4" /> Delete</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((slot) => {
          const m = bySlot[slot];
          return m ? (
            <MemberCard key={slot} m={m} onEdit={() => setEditing(m)} onMoves={() => setMoving(m)} onRelease={() => setRelease(m)} />
          ) : (
            <button key={slot} onClick={() => setAdding(slot)}
                    className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-box border-2 border-dashed border-base-content/30 text-sm opacity-70 transition hover:border-primary hover:opacity-100">
              <Plus className="size-6" />
              <span className="font-pixel text-[0.6rem]">Slot {slot} · empty</span>
            </button>
          );
        })}
      </div>

      {adding && <AddMemberModal teamId={team.id} slot={adding} onClose={() => setAdding(null)} onSaved={saved(setAdding)} />}
      {editing && <EditMemberModal member={editing} onClose={() => setEditing(null)} onSaved={saved(setEditing)} />}
      {moving && <MovesModal member={moving} onClose={() => setMoving(null)} onSaved={saved(setMoving)} />}
      {renaming && <RenameModal team={team} onClose={() => setRenaming(false)} onSaved={() => { setRenaming(false); reload(); }} />}
      {release && (
        <ConfirmModal title="Release this Pokémon?" confirmLabel="Release"
          message={<>{pretty(release.pokemon)}{release.nickname ? ` "${release.nickname}"` : ''} leaves the team and its moves are removed.</>}
          onConfirm={doRelease} onCancel={() => setRelease(null)} />
      )}
      {delTeam && (
        <ConfirmModal title={`Delete "${team.name}"?`}
          message={<>All {team.members} Pokémon on it are removed too. Blocked if this team has battle history.</>}
          onConfirm={doDeleteTeam} onCancel={() => setDelTeam(false)} />
      )}
    </div>
  );
}