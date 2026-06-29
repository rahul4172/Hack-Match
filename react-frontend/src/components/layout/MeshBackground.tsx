export function MeshBackground() {
  return (
    <div className="mesh-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export function CursorSpotlight({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-[5] transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at ${x}px ${y}px, rgba(139,92,246,0.08), transparent 40%)`,
      }}
      aria-hidden
    />
  );
}
