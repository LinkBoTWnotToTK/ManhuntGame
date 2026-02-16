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
    isPlaying, escapeOpen, stamina, maxStamina, playerHealth, playerAmmo,
    selectRole, startGame, resetGame,
  } = useGame();

  useEffect(() => {
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  useEffect(() => {
    if (isLocked && !isPlaying && !gameOver && role) startGame();
  }, [isLocked, isPlaying, gameOver, role, startGame]);

  const staminaPct = (stamina / maxStamina) * 100;
  const staminaColor = staminaPct > 50 ? "#00cc66" : staminaPct > 20 ? "#ffaa00" : "#ff3333";

  return (
    <>
      {isLocked && isPlaying && (
        <>
          {/* Crosshair */}
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="w-6 h-6 relative">
              <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-white/50 rounded-full" />
              <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-white/50 rounded-full" />
              <div className="absolute left-1/2 top-0 h-2 w-0.5 bg-white/50 rounded-full" />
              <div className="absolute left-1/2 bottom-0 h-2 w-0.5 bg-white/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/70" />
            </div>
          </div>

          {/* Hearts + Role + Score */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10 shadow-lg space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{role === "hunter" ? "🏹" : "🏃"}</span>
                <div>
                  {role === "hunter" ? (
                    <>
                      <div className="text-white font-bold text-xl tabular-nums">{score} / {totalNPCs}</div>
                      <div className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Runners Eliminated</div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-bold text-xl">SURVIVE</div>
                      <div className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Evade the hunters</div>
                    </>
                  )}
                </div>
              </div>
              {/* Hearts */}
              <div className="flex gap-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className={`text-xl transition-all ${i < playerHealth ? "opacity-100 scale-100" : "opacity-20 scale-75 grayscale"}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ammo */}
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🪃</span>
                <div>
                  <div className="text-white font-bold text-xl tabular-nums">{playerAmmo}</div>
                  <div className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Slingshot</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10 shadow-lg">
              <div className={`font-mono text-2xl font-black tracking-wider text-center tabular-nums ${
                timeLeft <= 10 ? "text-red-400 animate-pulse" : timeLeft <= 20 ? "text-yellow-400" : "text-white"
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] text-center">
                {escapeOpen ? "⚡ ESCAPE OPEN" : "Until Escape Opens"}
              </div>
            </div>
          </div>

          {/* Stamina bar */}
          <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5 w-36">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Stamina</span>
                <kbd className="text-[9px] px-1 py-0.5 bg-white/10 rounded text-white/50 ml-auto">Shift</kbd>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{ width: `${staminaPct}%`, backgroundColor: staminaColor }}
                />
              </div>
            </div>
          </div>

          {/* Escape alerts */}
          {escapeOpen && role === "runner" && (
            <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-green-950/90 backdrop-blur-md rounded-full px-6 py-2 border border-green-500/50 shadow-[0_0_30px_rgba(0,255,68,0.3)]">
                <span className="text-green-400 font-bold text-sm uppercase tracking-wider animate-pulse">
                  🚪 RUN TO THE GREEN PORTAL!
                </span>
              </div>
            </div>
          )}
          {escapeOpen && role === "hunter" && (
            <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-950/90 backdrop-blur-md rounded-full px-6 py-2 border border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                <span className="text-red-400 font-bold text-sm uppercase tracking-wider animate-pulse">
                  ⚠️ HURRY! RUNNERS ESCAPING!
                </span>
              </div>
            </div>
          )}

          {/* Progress bar (hunter) */}
          {role === "hunter" && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-72">
              <div className="bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(score / totalNPCs) * 100}%`,
                    background: "linear-gradient(90deg, #ff4444, #ff8800, #ffcc00)",
                    boxShadow: "0 0 10px rgba(255,136,0,0.5)",
                  }}
                />
              </div>
            </div>
          )}

          <TagFlash score={score} role={role} />
        </>
      )}

      {/* Game over */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg">
          <div className="text-center space-y-6 animate-scale-in">
            <div className="text-7xl mb-2">{gameResult === "win" ? "🏆" : "💀"}</div>
            <h1 className="text-6xl font-black text-white tracking-tight">
              {gameResult === "win" ? "VICTORY" : "DEFEATED"}
            </h1>
            <p className="text-2xl text-white/60 font-mono tabular-nums">{formatTime(elapsedTime)}</p>
            {role === "hunter" && gameResult === "win" && <p className="text-white/40">All runners eliminated!</p>}
            {role === "hunter" && gameResult === "lose" && <p className="text-white/40">You were taken down! Try again.</p>}
            {role === "runner" && gameResult === "win" && <p className="text-green-400/60">You escaped! 🎉</p>}
            {role === "runner" && gameResult === "lose" && <p className="text-red-400/60">Defeated by the hunters!</p>}
            <button
              onClick={() => { resetGame(); window.location.reload(); }}
              className="mt-4 px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 text-lg font-bold transition-all hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Role selection */}
      {!isLocked && !gameOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="text-center space-y-8 animate-fade-in max-w-xl">
            <h1 className="text-6xl font-black text-white tracking-tight">HIDE & SEEK</h1>
            <p className="text-sm text-white/30 uppercase tracking-[0.3em]">Third Person</p>

            {!role ? (
              <>
                <p className="text-lg text-white/60">Choose your role</p>
                <div className="flex gap-5 justify-center">
                  <button
                    onClick={() => selectRole("hunter")}
                    className="group px-8 py-7 bg-red-950/50 hover:bg-red-900/60 text-white rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all hover:scale-105 active:scale-95 space-y-3 w-48"
                  >
                    <div className="text-5xl">🏹</div>
                    <div className="text-xl font-black">HUNTER</div>
                    <div className="text-xs text-white/40 leading-relaxed">
                      Eliminate 7 runners<br />with tag or slingshot
                    </div>
                    <div className="text-[10px] text-red-400/50 uppercase tracking-wider">+ 1 Ally Hunter</div>
                  </button>
                  <button
                    onClick={() => selectRole("runner")}
                    className="group px-8 py-7 bg-blue-950/50 hover:bg-blue-900/60 text-white rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all hover:scale-105 active:scale-95 space-y-3 w-48"
                  >
                    <div className="text-5xl">🏃</div>
                    <div className="text-xl font-black">RUNNER</div>
                    <div className="text-xs text-white/40 leading-relaxed">
                      Survive 1 minute<br />then reach the portal
                    </div>
                    <div className="text-[10px] text-blue-400/50 uppercase tracking-wider">Fight Back!</div>
                  </button>
                </div>
              </>
            ) : (
              <div
                className="space-y-5 cursor-pointer"
                onClick={() => document.body.requestPointerLock()}
              >
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 max-w-sm mx-auto">
                  <p className="text-white/70 leading-relaxed">
                    {role === "hunter"
                      ? "Hunt all 7 runners! Tag them up close or shoot with your slingshot (5 ammo). Your ally hunter helps the chase. Medkits spawn every 30s."
                      : "Evade 3 hunters for 60 seconds, then reach the portal! Shoot back with your slingshot (5 ammo). Being tagged = instant KO!"}
                  </p>
                </div>
                <p className="text-white/90 text-lg font-bold">Click to start</p>
                <div className="flex gap-4 justify-center text-white/40 text-xs flex-wrap">
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">WASD</kbd> Move</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">Shift</kbd> Sprint</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">Mouse</kbd> Look</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">LMB</kbd> Shoot</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); selectRole(null as unknown as Role); }}
                  className="text-white/20 text-xs hover:text-white/50 underline mt-4 transition-colors"
                >
                  ← Change role
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
      const t = setTimeout(() => setShow(false), 1000);
      setPrevScore(score);
      return () => clearTimeout(t);
    }
  }, [score, prevScore]);

  if (!show || role !== "hunter") return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-in">
      <div className="text-4xl font-black text-red-400 drop-shadow-[0_0_30px_rgba(255,60,60,0.9)] uppercase tracking-wider">
        ELIMINATED! 🎯
      </div>
    </div>
  );
}
