import { useRef, useEffect } from "react";
import { useGame, MAP_BOUNDS, ESCAPE_POSITIONS } from "./GameState";
import { playerPosition, npcPositions } from "./SharedState";

const MAP_SIZE = 140;
const PADDING = 6;
const DRAW_INTERVAL = 3; // Only draw every N frames

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameCount = useRef(0);
  const { selectedMap, isPlaying, role, tagged, escapeOpen, coinPickups } = useGame();
  const bounds = MAP_BOUNDS[selectedMap || "suburban"];
  const escapePos = ESCAPE_POSITIONS[selectedMap || "suburban"];

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const scale = MAP_SIZE / Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);

    const toX = (wx: number) => PADDING + (wx - bounds.minX) * scale * ((MAP_SIZE - PADDING * 2) / MAP_SIZE);
    const toY = (wz: number) => PADDING + (wz - bounds.minZ) * scale * ((MAP_SIZE - PADDING * 2) / MAP_SIZE);

    const draw = () => {
      frameCount.current++;
      // Throttle: only redraw every N frames
      if (frameCount.current % DRAW_INTERVAL !== 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 8);
      ctx.stroke();

      // Coins
      ctx.fillStyle = "rgba(255,200,0,0.6)";
      for (const coin of coinPickups) {
        ctx.beginPath();
        ctx.arc(toX(coin.position[0]), toY(coin.position[2]), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Escape portal
      if (escapeOpen && role === "runner") {
        const t = Date.now() / 500;
        ctx.fillStyle = `rgba(0,255,100,${0.5 + Math.sin(t) * 0.3})`;
        ctx.beginPath();
        ctx.arc(toX(escapePos[0]), toY(escapePos[2]), 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // NPCs
      for (const [id, pos] of npcPositions) {
        if (tagged.has(id)) continue;
        let color = "#888";
        if (id.startsWith("h") && !id.startsWith("ah")) color = "#ff3333";
        else if (id.startsWith("ah")) color = "#00ff88";
        else if (id.startsWith("r")) color = "#33aaff";

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(toX(pos.x), toY(pos.z), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(toX(playerPosition.x), toY(playerPosition.z), 3.5, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, selectedMap, role, tagged, escapeOpen, coinPickups, bounds, escapePos]);

  if (!isPlaying) return null;

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        className="rounded-lg"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="flex gap-2 mt-1 justify-center">
        <span className="text-[8px] text-white/30">⬤ You</span>
        <span className="text-[8px] text-red-400/50">⬤ Hunter</span>
        <span className="text-[8px] text-blue-400/50">⬤ Runner</span>
      </div>
    </div>
  );
}
