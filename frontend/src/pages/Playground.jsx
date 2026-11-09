import { useState } from 'react';
import toast from 'react-hot-toast';
import { Play, ShieldAlert, CheckCircle2, XCircle, Undo2 } from 'lucide-react';
import { api } from '../api.js';
import { useFetch } from '../hooks/useFetch.js';
import { toastError } from '../utils/toast.js';
import ResultTable from '../components/ResultTable.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

const group = (c) => c.split(' (')[0];

function Result({ r }) {
  return (
    <div className="mt-3 space-y-3 border-t border-base-content/10 pt-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {r.outcome === 'error'
          ? <span className="badge badge-error gap-1"><ShieldAlert className="size-3" /> Rejected by MySQL</span>
          : <span className="badge badge-success gap-1"><CheckCircle2 className="size-3" /> Succeeded</span>}
        {r.matched
          ? <span className="badge badge-outline gap-1">as expected</span>
          : <span className="badge badge-warning gap-1"><XCircle className="size-3" /> NOT as expected</span>}
        <span className="badge badge-ghost gap-1"><Undo2 className="size-3" /> rolled back</span>
      </div>

      {r.error && (
        <div role="alert" className="alert alert-error alert-soft items-start text-sm">
          <div className="min-w-0">
            <p className="font-semibold">{r.error.error}</p>
            {r.error.constraint && <p>Constraint: <code>{r.error.constraint}</code></p>}
            {r.error.mysql && <p className="mt-1 break-words font-mono text-xs opacity-80">{r.error.mysql.code}: {r.error.mysql.message}</p>}
          </div>
        </div>
      )}

      {r.steps.filter((s) => s.rows).map((s, i) => (
        <div key={i}><ResultTable rows={s.rows} /></div>
      ))}
    </div>
  );
}

export default function Playground() {
  const catalog = useFetch('/constraints');
  const [results, setResults] = useState({});
  const [summary, setSummary] = useState(null);
  const [running, setRunning] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const runOne = async (id) => {
    setRunning(id);
    try {
      const r = await api.post(`/constraints/${id}/run`);
      setResults((s) => ({ ...s, [id]: r }));
    } catch (e) { toastError(e); }
    setRunning(null);
  };

  const runAll = async () => {
    setRunning('all');
    try {
      const r = await api.post('/constraints/run-all');
      setResults(Object.fromEntries(r.results.map((x) => [x.id, x])));
      setSummary({ total: r.total, matched: r.matched, failed: r.failed });
      r.failed.length ? toast.error(`${r.failed.length} demo(s) did not behave as expected`) : toast.success('All demos behaved as expected');
    } catch (e) { toastError(e); }
    setRunning(null);
  };

  const demos = catalog.data ?? [];
  const groups = ['ALL', ...new Set(demos.map((d) => group(d.constraint)))];
  const shown = demos.filter((d) => filter === 'ALL' || group(d.constraint) === filter);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-pixel text-sm">Constraint playground</h1>
        <button className="btn btn-primary btn-sm" onClick={runAll} disabled={!!running}>
          {running === 'all' ? <span className="loading loading-spinner loading-xs" /> : <Play className="size-4" />} Run all {demos.length || ''}
        </button>
      </div>
      <p className="mb-4 text-sm opacity-70">
        Each demo runs real SQL against the database inside a transaction that is <b>always rolled back</b>, so nothing is ever saved.
      </p>

      {summary && (
        <div className={`alert mb-4 ${summary.failed.length ? 'alert-warning' : 'alert-success'} alert-soft`}>
          {summary.matched}/{summary.total} demos behaved as expected{summary.failed.length ? `. Check: ${summary.failed.join(', ')}` : '.'}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1">
        {groups.map((g) => (
          <button key={g} onClick={() => setFilter(g)} className={`btn btn-xs ${filter === g ? 'btn-primary' : 'btn-outline'}`}>{g}</button>
        ))}
      </div>

      <ErrorAlert error={catalog.error} onRetry={catalog.reload} />
      {catalog.loading && <PokeballLoader />}

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((d) => (
          <div key={d.id} className="card border-2 border-base-content/20 bg-base-100">
            <div className="card-body gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="badge badge-secondary badge-sm mb-1">{d.constraint}</span>
                  <h3 className="text-sm font-semibold">{d.title}</h3>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => runOne(d.id)} disabled={!!running}>
                  {running === d.id ? <span className="loading loading-spinner loading-xs" /> : <Play className="size-4" />} Run
                </button>
              </div>
              <p className="text-sm opacity-70">{d.why}</p>
              <details className="text-xs">
                <summary className="cursor-pointer opacity-70">Show SQL ({d.steps.length} statement{d.steps.length > 1 ? 's' : ''})</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-box bg-neutral p-3 text-neutral-content">{d.steps.join(';\n')};</pre>
              </details>
              {results[d.id] && <Result r={results[d.id]} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}