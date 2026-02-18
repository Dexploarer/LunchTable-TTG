export interface VttToken {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
}

interface TokenLayerProps {
  tokens: VttToken[];
}

export function TokenLayer({ tokens }: TokenLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {tokens.map((token) => (
        <div
          key={token.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 border-2 border-[#121212] rounded-full shadow-zine"
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: "42px",
            height: "42px",
            backgroundColor: token.color ?? "#ffcc00",
          }}
          title={token.name}
        >
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase bg-white border border-[#121212] px-1">
            {token.name}
          </span>
        </div>
      ))}
    </div>
  );
}
