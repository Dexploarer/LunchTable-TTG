interface FogLayerProps {
  enabled: boolean;
  opacity?: number;
}

export function FogLayer({ enabled, opacity = 0.35 }: FogLayerProps) {
  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2), transparent 40%), repeating-linear-gradient(45deg, rgba(18,18,18,0.85), rgba(18,18,18,0.85) 8px, rgba(18,18,18,0.75) 8px, rgba(18,18,18,0.75) 16px)",
        opacity,
      }}
    />
  );
}
