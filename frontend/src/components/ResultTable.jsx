export default function ResultTable({ rows, max = 200 }) {
  if (!rows?.length) return <p className="text-sm opacity-60">(0 rows)</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-box border border-base-content/20">
      <table className="table table-zebra table-xs sm:table-sm">
        <thead>
          <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, max).map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} className="whitespace-nowrap">
                  {r[c] === null ? <span className="opacity-40">NULL</span> : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-1 text-xs opacity-60">
        {rows.length} row{rows.length === 1 ? '' : 's'}{rows.length > max ? ` (showing first ${max})` : ''}
      </p>
    </div>
  );
}