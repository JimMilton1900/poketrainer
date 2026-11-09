import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import ResultTable from '../components/ResultTable.jsx';
import PokeballLoader from '../components/PokeballLoader.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

function QueryReports() {
  const list = useFetch('/reports');
  const [sel, setSel] = useState(1);
  const rep = useFetch(`/reports/${sel}`);

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-1">
        <ErrorAlert error={list.error} onRetry={list.reload} />
        {list.loading && <PokeballLoader />}
        {list.data?.map((r) => (
          <button key={r.id} onClick={() => setSel(r.id)}
                  className={`btn btn-sm h-auto w-full justify-start py-2 text-left font-normal ${sel === r.id ? 'btn-primary' : 'btn-ghost'}`}>
            <span className="font-pixel text-[0.55rem] opacity-70">Q{r.id}</span>
            <span className="text-sm">{r.title}</span>
          </button>
        ))}
      </aside>

      <section className="min-w-0 space-y-4">
        <ErrorAlert error={rep.error} onRetry={rep.reload} />
        {rep.loading && !rep.data && <PokeballLoader />}
        {rep.data && (
          <>
            <div>
              <h2 className="font-pixel text-xs leading-relaxed">Q{rep.data.id} · {rep.data.title}</h2>
              <p className="mt-1 text-sm opacity-70">{rep.data.purpose}</p>
            </div>
            <pre className="overflow-x-auto rounded-box bg-neutral p-4 text-xs text-neutral-content"><code>{rep.data.sql}</code></pre>
            <ResultTable rows={rep.data.rows} />
          </>
        )}
      </section>
    </div>
  );
}

function ViewReport() {
  const { data, loading, error, reload } = useFetch('/views/v_team_summary');
  if (loading && !data) return <PokeballLoader />;
  return (
    <div className="space-y-4">
      <ErrorAlert error={error} onRetry={reload} />
      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-pixel text-xs">{data.name}</h2>
            <span className="badge badge-secondary">{data.type}</span>
            <span className={`badge ${data.updatable ? 'badge-success' : 'badge-warning'}`}>
              {data.updatable ? 'updatable' : 'read-only (GROUP BY + aggregates)'}
            </span>
          </div>
          <p className="text-sm opacity-70">
            The definition below is read live with <code>SHOW CREATE VIEW</code>. The rows are produced by that stored query each time the view is read.
          </p>
          <pre className="whitespace-pre-wrap break-words rounded-box bg-neutral p-4 text-xs text-neutral-content"><code>{data.createStatement}</code></pre>
          <div className="flex flex-wrap gap-1">
            {data.columns.map((c) => <span key={c.name} className="badge badge-outline">{c.name} · {c.type}</span>)}
          </div>
          <ResultTable rows={data.rows} />
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('queries');
  return (
    <div>
      <h1 className="mb-4 font-pixel text-sm">Reports</h1>
      <div role="tablist" className="tabs tabs-box mb-4 w-fit">
        <button role="tab" className={`tab ${tab === 'queries' ? 'tab-active' : ''}`} onClick={() => setTab('queries')}>SQL queries</button>
        <button role="tab" className={`tab ${tab === 'view' ? 'tab-active' : ''}`} onClick={() => setTab('view')}>View</button>
      </div>
      {tab === 'queries' ? <QueryReports /> : <ViewReport />}
    </div>
  );
}