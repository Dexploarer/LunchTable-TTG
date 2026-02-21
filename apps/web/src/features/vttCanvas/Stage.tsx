import { useEffect, useMemo, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";
import { FogLayer } from "./FogLayer";
import { TokenLayer, type VttToken } from "./TokenLayer";
import { WallLayer, type VttWall } from "./WallLayer";
import { clientPointToPercent, clampPercent } from "./geometry";

interface StageProps {
  tokens: VttToken[];
  walls: VttWall[];
  fogEnabled: boolean;
  onTokenMove?: (
    tokenId: string,
    x: number,
    y: number,
    options?: { commit?: boolean },
  ) => void;
}

export function Stage({ tokens, walls, fogEnabled, onTokenMove }: StageProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const boundsRef = useRef<HTMLDivElement | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(tokens[0]?.id ?? null);

  useEffect(() => {
    setSelectedTokenId((current) => current ?? tokens[0]?.id ?? null);
  }, [tokens]);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host) return;

    const app = new Application();
    let disposed = false;

    void app.init({
      width: host.clientWidth,
      height: host.clientHeight,
      antialias: true,
      backgroundColor: 0xf7f5ef,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      if (disposed) return;
      host.appendChild(app.canvas);

      const bg = new Graphics();
      bg.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0xf8f6f0 });
      app.stage.addChild(bg);

      const grid = new Graphics();
      grid.setStrokeStyle({ color: 0xd9d4c7, width: 1, alpha: 0.8 });
      const step = Math.max(24, Math.round(app.screen.width / 20));
      for (let x = 0; x <= app.screen.width; x += step) {
        grid.moveTo(x, 0);
        grid.lineTo(x, app.screen.height);
      }
      for (let y = 0; y <= app.screen.height; y += step) {
        grid.moveTo(0, y);
        grid.lineTo(app.screen.width, y);
      }
      app.stage.addChild(grid);

      const inkBorder = new Graphics();
      inkBorder.setStrokeStyle({ color: 0x121212, width: 3 });
      inkBorder.rect(1.5, 1.5, app.screen.width - 3, app.screen.height - 3);
      app.stage.addChild(inkBorder);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!canvasRef.current) return;
      app.renderer.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    });
    resizeObserver.observe(host);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      app.destroy(true, { children: true });
      if (host.contains(app.canvas)) {
        host.removeChild(app.canvas);
      }
    };
  }, []);

  const selected = useMemo(
    () => tokens.find((token) => token.id === selectedTokenId) ?? tokens[0] ?? null,
    [tokens, selectedTokenId],
  );

  return (
    <div className="space-y-2">
      <div className="paper-panel-flat p-2 flex items-center gap-2 text-xs uppercase">
        <span>Selected Token:</span>
        <select
          className="border border-[#121212] px-2 py-1 bg-white"
          value={selected?.id ?? ""}
          onChange={(event) => setSelectedTokenId(event.target.value)}
        >
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.name}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={boundsRef}
        className="relative w-full h-[420px] border-2 border-[#121212] overflow-hidden bg-[#f8f6f0]"
        onClick={(event) => {
          if (!selected || !onTokenMove) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const point = clientPointToPercent(
            { clientX: event.clientX, clientY: event.clientY },
            bounds,
          );

          onTokenMove(
            selected.id,
            clampPercent(point.x),
            clampPercent(point.y),
            { commit: true },
          );
        }}
      >
        <div ref={canvasRef} className="absolute inset-0" />
        <WallLayer walls={walls} />
        <TokenLayer
          tokens={tokens}
          boundsRef={boundsRef}
          selectedTokenId={selectedTokenId}
          onSelectToken={(tokenId) => setSelectedTokenId(tokenId)}
          onTokenMove={onTokenMove}
        />
        <FogLayer enabled={fogEnabled} />
      </div>
    </div>
  );
}
