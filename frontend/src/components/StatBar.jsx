// Base stats go up to 255. Class names are written out in full so Tailwind can see them.
const colorFor = (v) =>
  v < 50 ? 'progress-error' : v < 90 ? 'progress-warning' : 'progress-success';

export default function StatBar({ label, value, max = 255 }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 shrink-0 font-pixel text-[0.55rem] uppercase opacity-70">{label}</span>
      <span className="w-8 shrink-0 text-right font-semibold">{value}</span>
      <progress className={`progress ${colorFor(value)} h-2 flex-1`} value={value} max={max} />
    </div>
  );
}