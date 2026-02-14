import { useState, useEffect } from "react";
import { useGame, Role } from "./GameState";

function formatTime(secs: number) {
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

export default function GameUI() {
  const [isLocked, setIsLocked] = useState(false);
  const {
    role, score, totalNPCs, elapsedTime, timeLeft, gameOver, gameResult,
    isPlaying, escapeOpen, selectRole, startGame, resetGame
  } = useGame();

  useEffect(() => {
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  useEffect(() => {
    if (isLocked && !isPlaying && !gameOver && role) {
      startGame();
    }
  }, [isLocked, isPlaying, gameOver, role, startGame]);

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

          {/* Role badge + score (hunter) or survival info (runner) */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{role === "hunter" ? "🏹" : "🏃"}</span>
                <div>
                  {role === "hunter" ? (
                    <>
                      <div className="text-white font-bold text-lg">{score} / {totalNPCs}</div>
                      <div className="text-white/50 text-xs uppercase tracking-widest">Tagged</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-bold text-lg">SURVIVE</div>
                      <div className="text-white/50 text-xs uppercase tracking-widest">Don't get caught</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10">
              <div className={`font-mono text-xl font-bold tracking-wider ${timeLeft <= 10 ? "text-red-400" : timeLeft <= 30 ? "text-yellow-400" : "text-white"}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-white/50 text-xs uppercase tracking-widest text-right">
                {escapeOpen ? "ESCAPE OPEN!" : "Until escape"}
              </div>
            </div>
          </div>

          {/* Escape open alert */}
          {escapeOpen && role === "runner" && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-green-900/80 backdrop-blur-md rounded-full px-6 py-2 border border-green-400/60 animate-pulse">
                <span className="text-green-400 font-bold text-sm uppercase tracking-wider">
                  🚪 ESCAPE ZONE IS OPEN — RUN TO THE PORTAL!
                </span>
              </div>
            </div>
          )}

          {escapeOpen && role === "hunter" && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-900/80 backdrop-blur-md rounded-full px-6 py-2 border border-red-400/60 animate-pulse">
                <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
                  ⚠️ RUNNERS CAN ESCAPE — TAG THEM FAST!
                </span>
              </div>
            </div>
          )}

          {/* Sprint hint */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/5">
              <span className="text-white/40 text-xs">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Shift</kbd> Sprint
              </span>
            </div>
          </div>

          {/* Progress bar (hunter) */}
          {role === "hunter" && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-64">
              <div className="bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(score / totalNPCs) * 100}%`,
                    background: "linear-gradient(90deg, #ff4444, #ff8800, #ffcc00)",
                  }}
                />
              </div>
            </div>
          )}

          <TagFlash score={score} role={role} />
        </>
      )}

      {/* Game over screen */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center space-y-6 animate-scale-in">
            <div className="text-6xl mb-2">{gameResult === "win" ? "🏆" : "💀"}</div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              {gameResult === "win" ? "You Win!" : "Game Over"}
            </h1>
            <p className="text-2xl text-white/70 font-mono">
              Time: {formatTime(elapsedTime)}
            </p>
            {role === "hunter" && (
              <p className="text-white/50">All {totalNPCs} runners tagged!</p>
            )}
            {role === "runner" && gameResult === "win" && (
              <p className="text-white/50">You escaped successfully!</p>
            )}
            {role === "runner" && gameResult === "lose" && (
              <p className="text-white/50">You were caught!</p>
            )}
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

      {/* Role selection / Start screen */}
      {!isLocked && !gameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="text-center space-y-8 animate-fade-in max-w-lg">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              🏠 Hide & Seek
            </h1>

            {!role ? (
              <>
                <p className="text-lg text-white/70">Choose your role</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => selectRole("hunter")}
                    className="px-8 py-6 bg-red-900/40 hover:bg-red-900/60 text-white rounded-2xl border border-red-500/30 hover:border-red-500/60 transition-all hover:scale-105 space-y-2"
                  >
                    <div className="text-4xl">🏹</div>
                    <div className="text-xl font-bold">Hunter</div>
                    <div className="text-sm text-white/50">Chase & tag all runners</div>
                    <div className="text-xs text-white/30">before the escape opens</div>
                  </button>
                  <button
                    onClick={() => selectRole("runner")}
                    className="px-8 py-6 bg-blue-900/40 hover:bg-blue-900/60 text-white rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all hover:scale-105 space-y-2"
                  >
                    <div className="text-4xl">🏃</div>
                    <div className="text-xl font-bold">Runner</div>
                    <div className="text-sm text-white/50">Survive for 2 minutes</div>
                    <div className="text-xs text-white/30">then reach the escape portal</div>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-white/70">
                  {role === "hunter"
                    ? "Tag all 5 runners before the escape opens!"
                    : "Survive 2 minutes, then reach the green portal to escape!"}
                </p>
                <p className="text-white/90 text-lg font-medium">
                  Click anywhere to start
                </p>
                <div className="flex gap-6 justify-center text-white/50 text-sm">
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">WASD</kbd> Move</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Shift</kbd> Sprint</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Mouse</kbd> Look</span>
                </div>
                <button
                  onClick={() => selectRole(null as unknown as Role)}
                  className="text-white/30 text-sm hover:text-white/60 underline mt-4"
                >
                  Change role
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TagFlash({ score, role }: { score: number; role: Role | null }) {
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

  if (!show || role !== "hunter") return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="text-3xl font-bold text-red-400 drop-shadow-[0_0_20px_rgba(255,60,60,0.8)]">
        TAGGED! 🏷️
      </div>
    </div>
  );
}
