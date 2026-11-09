import { TriangleAlert } from 'lucide-react';

// Works with ApiError objects: shows the message, the constraint name and the raw MySQL text
export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="alert alert-error alert-soft items-start">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{error.message}</p>
        {error.body?.constraint && <p>Constraint: <code>{error.body.constraint}</code></p>}
        {error.body?.mysql?.message && (
          <p className="mt-1 break-words font-mono text-xs opacity-80">
            MySQL {error.body.mysql.code}: {error.body.mysql.message}
          </p>
        )}
      </div>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}>Retry</button>}
    </div>
  );
}