export default function PokeballLoader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="pokeball pokeball-spin" />
      <p className="font-pixel text-[0.65rem] opacity-70">{label}</p>
    </div>
  );
}