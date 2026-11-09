import { pretty } from '../utils/format.js';

export default function TypeBadge({ type }) {
  return (
    <span
      className="badge border-0 font-pixel text-[0.6rem] uppercase text-white"
      style={{
        backgroundColor: `var(--color-type-${type})`,
        textShadow: '0 1px 1px rgb(0 0 0 / 0.45)',
      }}
    >
      {pretty(type)}
    </span>
  );
}