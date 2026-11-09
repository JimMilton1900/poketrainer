import TypeBadge from './TypeBadge.jsx';
import StatBar from './StatBar.jsx';
import { pretty, dexNo } from '../utils/format.js';

export default function PokemonCard({ pokemon: p, compact = false }) {
  const main = p.types?.[0] ?? 'normal';
  return (
    <div className="card border-2 border-base-content/20 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <figure
        className="relative h-32 rounded-t-[inherit]"
        style={{ backgroundColor: `color-mix(in srgb, var(--color-type-${main}) 35%, transparent)` }}
      >
        <span className="absolute left-2 top-2 badge badge-neutral font-pixel text-[0.55rem]">
          {dexNo(p.id)}
        </span>
        {p.sprite_url && (
          <img
            src={p.sprite_url}
            alt={p.name}
            loading="lazy"
            className="h-28 w-28 object-contain [image-rendering:pixelated]"
            style={{ transform: 'scale(1.3)' }}
          />
        )}
      </figure>
      <div className="card-body gap-2 p-4">
        <h3 className="font-pixel text-xs leading-relaxed">{pretty(p.name)}</h3>
        <div className="flex gap-1">
          {p.types?.map((t) => <TypeBadge key={t} type={t} />)}
        </div>
        {!compact && (
          <div className="mt-1 space-y-1">
            <StatBar label="HP" value={p.base_hp} />
            <StatBar label="ATK" value={p.base_attack} />
            <StatBar label="DEF" value={p.base_defense} />
            <StatBar label="SPD" value={p.base_speed} />
          </div>
        )}
      </div>
    </div>
  );
}