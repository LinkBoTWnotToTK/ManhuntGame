import { useState, useEffect } from "react";
import { useGame } from "./GameState";

function formatTime(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GameUI() {
  const [isLocked, setIsLocked] = useState(false);
  const { score, totalItems, elapsedTime, gameWon, isPlaying, startGame, resetGame } = useGame();

  useEffect(() => {
    const onChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Start game on first pointer lock
  useEffect(() => {
    if (isLocked && !isPlaying && !gameWon) {
      startGame();
    }
  }, [isLocked, isPlaying, gameWon, startGame]);

  return (
    <>
      {/* HUD */}
      {isLocked && isPlaying && (
        <>
          {/* Crosshair */}
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="w-5 h-5 relative">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/40" />
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/40" />
            </div>
          </div>

          {/* Score */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <div className="text-white font-bold text-lg tracking-wide">
                    {score} / {totalItems}
                  </div>
                  <div className="text-white/50 text-xs uppercase tracking-widest">Orbs Found</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className="text-white font-mono text-xl font-bold tracking-wider">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-white/50 text-xs uppercase tracking-widest text-right">Time</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-64">
            <div className="bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(score / totalItems) * 100}%`,
                  background: "linear-gradient(90deg, #ffd700, #ff6b6b, #c792ea, #4ecdc4)",
                }}
              />
            </div>
          </div>

          {/* Collection flash */}
          <CollectionFlash score={score} />
        </>
      )}

      {/* Win screen */}
      {gameWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center space-y-6 animate-scale-in">
            <div className="text-6xl mb-2">🏆</div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              You Win!
            </h1>
            <p className="text-2xl text-white/70 font-mono">
              Time: {formatTime(elapsedTime)}
            </p>
            <p className="text-white/50">
              All {totalItems} orbs collected!
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
              🏠 House Explorer
            </h1>
            <p className="text-lg text-yellow-400/80 font-medium">
              Find all {totalItems} hidden orbs!
            </p>
            <div className="space-y-3">
              <p className="text-white/90 text-lg font-medium">
                Click anywhere to start
              </p>
              <div className="flex gap-6 justify-center text-white/50 text-sm">
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">W A S D</kbd> Move</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Mouse</kbd> Look</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">ESC</kbd> Pause</span>
              </div>
              <p className="text-white/40 text-sm mt-4">
                Walk near orbs to collect them
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CollectionFlash({ score }: { score: number }) {
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
      <div className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
        +1 ✨
      </div>
    </div>
  );
}
