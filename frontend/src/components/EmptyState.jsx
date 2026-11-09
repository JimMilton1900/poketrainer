export default function EmptyState({ text = 'Nothing here yet.', children }) {
  return (
    <div className="rounded-box border-2 border-dashed border-base-content/30 py-12 text-center">
      <div className="pokeball mx-auto mb-3 opacity-60" />
      <p className="text-sm opacity-70">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}