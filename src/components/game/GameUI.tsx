import { useState, useEffect, useRef } from "react";
import { useGame } from "./GameState";

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getProximityLabel(dist: number): { text: string; color: string; emoji: string } {
  if (dist < 2) return { text: "ON FIRE! 🔥", color: "#ff0000", emoji: "🔥" };
  if (dist < 4) return { text: "Very Hot!", color: "#ff4500", emoji: "🟥" };
  if (dist < 6) return { text: "Warm", color: "#ffa500", emoji: "🟧" };
  if (dist < 9) return { text: "Cool", color: "#87ceeb", emoji: "🟦" };
  return { text: "Freezing", color: "#4169e1", emoji: "🧊" };
}

export default function GameUI() {
  const [isLocked, setIsLocked] = useState(false);
  const { score, totalItems, elapsedTime, gameWon, isPlaying, startGame, resetGame, nearestDistance } = useGame();

  useEffect(() => {
    const onChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  useEffect(() => {
    if (isLocked && !isPlaying && !gameWon) {
      startGame();
    }
  }, [isLocked, isPlaying, gameWon, startGame]);

  const proximity = nearestDistance !== null ? getProximityLabel(nearestDistance) : null;

  return (
    <>
      {/* HUD */}
      {isLocked && isPlaying && (
        <>
          {/* Crosshair */}
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="w-6 h-6 relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/50 rounded-full" />
              <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Found counter */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👀</span>
                <div>
                  <div className="text-white font-bold text-lg tracking-wide">
                    {score} / {totalItems}
                  </div>
                  <div className="text-white/50 text-xs uppercase tracking-widest">Tagged</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className="text-white font-mono text-xl font-bold tracking-wider">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-white/50 text-xs uppercase tracking-widest text-right">Time</div>
            </div>
          </div>

          {/* Hot/Cold Proximity Radar */}
          {proximity && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div
                className="backdrop-blur-md rounded-full px-6 py-2 border transition-all duration-300"
                style={{
                  backgroundColor: `${proximity.color}22`,
                  borderColor: `${proximity.color}66`,
                  boxShadow: `0 0 20px ${proximity.color}33`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{proximity.emoji}</span>
                  <span
                    className="font-bold text-sm uppercase tracking-wider"
                    style={{ color: proximity.color }}
                  >
                    {proximity.text}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-64">
            <div className="bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(score / totalItems) * 100}%`,
                  background: "linear-gradient(90deg, #4169e1, #ffa500, #ff4500, #ff0000)",
                }}
              />
            </div>
          </div>

          {/* Tag flash */}
          <TagFlash score={score} />
        </>
      )}

      {/* Win screen */}
      {gameWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center space-y-6 animate-scale-in">
            <div className="text-6xl mb-2">🏆</div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Found Everyone!
            </h1>
            <p className="text-2xl text-white/70 font-mono">
              Time: {formatTime(elapsedTime)}
            </p>
            <p className="text-white/50">
              All {totalItems} hiders tagged!
            </p>
            <button
              onClick={() => {
                resetGame();
                window.location.reload();
              }}
              className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-lg font-medium transition-all hover:scale-105"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Start screen */}
      {!isLocked && !gameWon && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              🏠 Hide & Seek
            </h1>
            <p className="text-lg text-orange-400/90 font-medium">
              Find and tag all {totalItems} hiders!
            </p>
            <div className="space-y-3">
              <p className="text-white/90 text-lg font-medium">
                Click anywhere to start seeking
              </p>
              <div className="flex gap-6 justify-center text-white/50 text-sm">
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">W A S D</kbd> Move</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Mouse</kbd> Look</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">ESC</kbd> Pause</span>
              </div>
              <div className="mt-4 space-y-1 text-white/40 text-sm">
                <p>🔥 Hot / Cold radar helps you find hiders</p>
                <p>Walk close to tag them!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TagFlash({ score }: { score: number }) {
  const [show, setShow] = useState(false);
  const [prevScore, setPrevScore] = useState(0);

  useEffect(() => {
    if (score > prevScore && score > 0) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 800);
      setPrevScore(score);
      return () => clearTimeout(t);
    }
  }, [score, prevScore]);

  if (!show) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="text-3xl font-bold text-orange-400 drop-shadow-[0_0_20px_rgba(255,165,0,0.8)]">
        TAG! 🏷️
      </div>
    </div>
  );
}
