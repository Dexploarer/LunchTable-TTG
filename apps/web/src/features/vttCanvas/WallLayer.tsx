export interface VttWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface WallLayerProps {
  walls: VttWall[];
}

export function WallLayer({ walls }: WallLayerProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.x1}
          y1={wall.y1}
          x2={wall.x2}
          y2={wall.y2}
          stroke="#121212"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 1"
        />
      ))}
    </svg>
  );
}
