import { useRef } from "react";

export interface VttToken {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
}

interface TokenLayerProps {
  tokens: VttToken[];
  boundsRef?: React.RefObject<HTMLElement | null>;
  selectedTokenId?: string | null;
  onSelectToken?: (tokenId: string) => void;
  onTokenMove?: (tokenId: string, x: number, y: number, options?: { commit?: boolean }) => void;
}

interface DragState {
  tokenId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

export function TokenLayer({
  tokens,
  boundsRef,
  selectedTokenId,
  onSelectToken,
  onTokenMove,
}: TokenLayerProps) {
  const dragRef = useRef<DragState | null>(null);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {tokens.map((token) => (
        <button
          key={token.id}
          type="button"
          className={[
            "absolute -translate-x-1/2 -translate-y-1/2 border-2 rounded-full shadow-zine",
            "pointer-events-auto touch-none select-none",
            token.id === selectedTokenId ? "border-[#ffcc00]" : "border-[#121212]",
          ].join(" ")}
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: "42px",
            height: "42px",
            backgroundColor: token.color ?? "#ffcc00",
            outline: token.id === selectedTokenId ? "3px solid #ffcc00" : undefined,
            outlineOffset: token.id === selectedTokenId ? "2px" : undefined,
          }}
          title={token.name}
          onClick={(event) => {
            event.stopPropagation();
            onSelectToken?.(token.id);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelectToken?.(token.id);

            const host = boundsRef?.current;
            if (!host) return;
            if (!onTokenMove) return;

            const bounds = host.getBoundingClientRect();
            const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
            const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
            dragRef.current = {
              tokenId: token.id,
              pointerId: event.pointerId,
              offsetX: pointerX - token.x,
              offsetY: pointerY - token.y,
              moved: false,
            };

            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const dragState = dragRef.current;
            if (!dragState) return;
            if (dragState.tokenId !== token.id) return;
            if (dragState.pointerId !== event.pointerId) return;

            const host = boundsRef?.current;
            if (!host) return;
            if (!onTokenMove) return;

            const bounds = host.getBoundingClientRect();
            const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
            const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;

            const nextX = Math.max(2, Math.min(98, pointerX - dragState.offsetX));
            const nextY = Math.max(2, Math.min(98, pointerY - dragState.offsetY));

            if (!dragState.moved) {
              const delta = Math.abs(nextX - token.x) + Math.abs(nextY - token.y);
              dragState.moved = delta > 0.25;
            }

            dragRef.current = dragState;
            onTokenMove(token.id, nextX, nextY, { commit: false });
          }}
          onPointerUp={(event) => {
            const dragState = dragRef.current;
            if (!dragState) return;
            if (dragState.tokenId !== token.id) return;
            if (dragState.pointerId !== event.pointerId) return;

            const host = boundsRef?.current;
            if (!host || !onTokenMove) {
              dragRef.current = null;
              return;
            }

            const bounds = host.getBoundingClientRect();
            const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
            const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;

            const nextX = Math.max(2, Math.min(98, pointerX - dragState.offsetX));
            const nextY = Math.max(2, Math.min(98, pointerY - dragState.offsetY));

            if (dragState.moved) {
              onTokenMove(token.id, nextX, nextY, { commit: true });
            }

            dragRef.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={(event) => {
            const dragState = dragRef.current;
            if (!dragState) return;
            if (dragState.tokenId !== token.id) return;
            if (dragState.pointerId !== event.pointerId) return;

            dragRef.current = null;
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // ignore
            }
          }}
        >
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase bg-white border border-[#121212] px-1">
            {token.name}
          </span>
        </button>
      ))}
    </div>
  );
}
