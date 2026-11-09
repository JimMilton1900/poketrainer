export default function ComingSoon({ title }) {
  return (
    <div className="hero rounded-box border-2 border-dashed border-base-content/30 py-20">
      <div className="text-center">
        <div className="pokeball mx-auto mb-4" />
        <h1 className="font-pixel text-sm">{title}</h1>
        <p className="mt-3 opacity-70">Nothing to see here</p>
      </div>
    </div>
  );
}