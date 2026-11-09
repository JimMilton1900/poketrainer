export default function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase opacity-70">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs opacity-60">{hint}</span>}
    </label>
  );
}