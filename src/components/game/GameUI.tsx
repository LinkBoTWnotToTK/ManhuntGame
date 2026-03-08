import { useState, useEffect, useRef } from "react";
import { useGame, Role, GameMap } from "./GameState";
import Shop from "./Shop";

function formatTime(secs: number) {
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

const MAP_INFO: Record<GameMap, { name: string; emoji: string; desc: string; color: string; borderColor: string }> = {
  suburban: {
    name: "SUBURBAN", emoji: "🏡",
    desc: "House & garden with trees, fences & lampposts",
    color: "bg-emerald-950/50 hover:bg-emerald-900/60",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
  },
  industrial: {
    name: "INDUSTRIAL", emoji: "🏭",
    desc: "Warehouse yard with containers, pipes & machinery",
    color: "bg-orange-950/50 hover:bg-orange-900/60",
    borderColor: "border-orange-500/20 hover:border-orange-500/50",
  },
  forest: {
    name: "FOREST", emoji: "🌲",
    desc: "Woodland clearing with trees, rocks & campfires",
    color: "bg-teal-950/50 hover:bg-teal-900/60",
    borderColor: "border-teal-500/20 hover:border-teal-500/50",
  },
  arctic: {
    name: "ARCTIC", emoji: "❄️",
    desc: "Frozen tundra with igloos, ice walls & snowdrifts",
    color: "bg-cyan-950/50 hover:bg-cyan-900/60",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/50",
  },
  underground: {
    name: "UNDERGROUND", emoji: "🕳️",
    desc: "Bunker tunnels with vents, pipes & dim lighting",
    color: "bg-purple-950/50 hover:bg-purple-900/60",
    borderColor: "border-purple-500/20 hover:border-purple-500/50",
  },
  volcano: {
    name: "VOLCANO", emoji: "🌋",
    desc: "Molten caverns with lava rivers & obsidian walls",
    color: "bg-red-950/50 hover:bg-red-900/60",
    borderColor: "border-red-500/20 hover:border-red-500/50",
  },
  space_station: {
    name: "SPACE STATION", emoji: "🚀",
    desc: "Zero-G corridors with airlocks & control rooms",
    color: "bg-indigo-950/50 hover:bg-indigo-900/60",
    borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
  },
};

export default function GameUI() {
  const {
    role, selectedMap, score, totalNPCs, elapsedTime, timeLeft, gameOver, gameResult,
    isPlaying, escapeOpen, stamina, maxStamina, playerHealth, playerAmmo, maxHealth,
    coins, matchCoins,
    selectRole, selectMap, startGame, resetGame,
  } = useGame();

  const [menuStep, setMenuStep] = useState<"role" | "shop" | "map" | "ready">("role");
  const [transitioning, setTransitioning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  useEffect(() => {
    if (isLocked && !isPlaying && !gameOver && role && selectedMap && menuStep === "ready") {
      startGame();
    }
  }, [isLocked, isPlaying, gameOver, role, selectedMap, menuStep, startGame]);

  useEffect(() => {
    if (!role && !selectedMap) setMenuStep("role");
  }, [role, selectedMap]);

  const handleSelectRole = (r: Role) => {
    setTransitioning(true);
    selectRole(r);
    setTimeout(() => { setMenuStep("map"); setTransitioning(false); }, 300);
  };

  const handleSelectMap = (m: GameMap) => {
    setTransitioning(true);
    selectMap(m);
    setTimeout(() => { setMenuStep("ready"); setTransitioning(false); }, 300);
  };

  const handleBack = () => {
    setTransitioning(true);
    if (menuStep === "shop") {
      setTimeout(() => { setMenuStep("role"); setTransitioning(false); }, 300);
    } else if (menuStep === "map") {
      selectRole(null as unknown as Role);
      setTimeout(() => { setMenuStep("role"); setTransitioning(false); }, 300);
    } else if (menuStep === "ready") {
      selectMap(null as unknown as GameMap);
      setTimeout(() => { setMenuStep("map"); setTransitioning(false); }, 300);
    }
  };

  const staminaPct = (stamina / maxStamina) * 100;
  const staminaColor = staminaPct > 50 ? "#00cc66" : staminaPct > 20 ? "#ffaa00" : "#ff3333";
  const showMenu = !isPlaying && !gameOver;

  return (
    <>
      {/* === IN-GAME HUD === */}
      {isLocked && isPlaying && (
        <>
          {/* Crosshair */}
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <div className="absolute top-1/2 left-0 w-2.5 h-0.5 bg-white/60 rounded-full" style={{ transform: "translateY(-50%)" }} />
              <div className="absolute top-1/2 right-0 w-2.5 h-0.5 bg-white/60 rounded-full" style={{ transform: "translateY(-50%)" }} />
              <div className="absolute left-1/2 top-0 h-2.5 w-0.5 bg-white/60 rounded-full" style={{ transform: "translateX(-50%)" }} />
              <div className="absolute left-1/2 bottom-0 h-2.5 w-0.5 bg-white/60 rounded-full" style={{ transform: "translateX(-50%)" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80" />
            </div>
          </div>

          {/* Hearts + Role + Score */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10 shadow-2xl space-y-2">
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
              <div className="flex gap-1">
                {Array.from({ length: maxHealth }, (_, i) => (
                  <span key={i} className={`text-xl transition-all ${i < playerHealth ? "opacity-100 scale-100" : "opacity-20 scale-75 grayscale"}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ammo (runners only) */}
          {role === "runner" && (
            <div className="fixed top-4 right-4 z-50 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪃</span>
                  <div>
                    <div className="text-white font-bold text-xl tabular-nums">{playerAmmo}</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Slingshot</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coin counter */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-yellow-500/20 flex items-center gap-2">
              <span className="text-lg">🪙</span>
              <span className="text-yellow-400 font-bold tabular-nums">{coins}</span>
              {matchCoins > 0 && <span className="text-yellow-400/50 text-xs">(+{matchCoins})</span>}
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10 shadow-2xl">
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
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5 w-36">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Stamina</span>
                <kbd className="text-[9px] px-1 py-0.5 bg-white/10 rounded text-white/50 ml-auto">Shift</kbd>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-150" style={{ width: `${staminaPct}%`, backgroundColor: staminaColor }} />
              </div>
            </div>
          </div>

          {/* Escape alerts */}
          {escapeOpen && role === "runner" && (
            <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-green-950/90 backdrop-blur-md rounded-full px-6 py-2 border border-green-500/50 shadow-[0_0_30px_rgba(0,255,68,0.3)]">
                <span className="text-green-400 font-bold text-sm uppercase tracking-wider animate-pulse">🚪 RUN TO THE GREEN PORTAL!</span>
              </div>
            </div>
          )}
          {escapeOpen && role === "hunter" && (
            <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-950/90 backdrop-blur-md rounded-full px-6 py-2 border border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.3)]">
                <span className="text-red-400 font-bold text-sm uppercase tracking-wider animate-pulse">⚠️ HURRY! RUNNERS ESCAPING!</span>
              </div>
            </div>
          )}

          {/* Progress bar (hunter) */}
          {role === "hunter" && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-72">
              <div className="bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/10">
                <div className="h-2.5 rounded-full transition-all duration-500 ease-out" style={{
                  width: `${(score / totalNPCs) * 100}%`,
                  background: "linear-gradient(90deg, #ff4444, #ff8800, #ffcc00)",
                  boxShadow: "0 0 10px rgba(255,136,0,0.5)",
                }} />
              </div>
            </div>
          )}

          <TagFlash score={score} role={role} />
        </>
      )}

      {/* === GAME OVER === */}
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
            {/* Coin summary */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-xs mx-auto space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Coins collected</span>
                <span className="text-yellow-400 font-bold">🪙 {matchCoins}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">{gameResult === "win" ? "Win bonus" : "Consolation"}</span>
                <span className="text-yellow-400 font-bold">🪙 {gameResult === "win" ? 5 : 2}</span>
              </div>
              <div className="border-t border-white/10 pt-1 flex justify-between text-sm">
                <span className="text-white/60 font-bold">Total wallet</span>
                <span className="text-yellow-300 font-black">🪙 {coins}</span>
              </div>
            </div>
            <button
              onClick={() => { resetGame(); window.location.reload(); }}
              className="mt-4 px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 text-lg font-bold transition-all hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* === MAIN MENU === */}
      {showMenu && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-black via-black/95 to-black/90 backdrop-blur-sm">
          <div className={`text-center max-w-3xl transition-all duration-300 ${transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            {/* Title */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-7xl font-black text-white tracking-tight mb-2"
                style={{ textShadow: "0 0 40px rgba(255,255,255,0.15)" }}>
                HIDE & SEEK
              </h1>
              <p className="text-sm text-white/30 uppercase tracking-[0.4em]">Third Person Combat</p>
              {/* Coin balance always visible */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-lg">🪙</span>
                <span className="text-yellow-400 font-bold tabular-nums">{coins}</span>
              </div>
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {["role", "map", "ready"].map((s, i) => (
                  <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                    (menuStep === s || (menuStep === "shop" && s === "role"))
                      ? "w-8 bg-white"
                      : i < ["role", "map", "ready"].indexOf(menuStep === "shop" ? "role" : menuStep)
                        ? "w-4 bg-white/40" : "w-4 bg-white/10"
                  }`} />
                ))}
              </div>
            </div>

            {/* Step: Role */}
            {menuStep === "role" && (
              <div className="animate-fade-in space-y-6">
                <p className="text-lg text-white/60 font-medium">Choose your role</p>
                <div className="flex gap-5 justify-center">
                  <button onClick={() => handleSelectRole("hunter")}
                    className="group px-8 py-7 bg-red-950/50 hover:bg-red-900/60 text-white rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all duration-200 hover:scale-105 active:scale-95 space-y-3 w-52">
                    <div className="text-5xl group-hover:scale-110 transition-transform">🏹</div>
                    <div className="text-xl font-black">HUNTER</div>
                    <div className="text-xs text-white/40 leading-relaxed">Tag & eliminate runners<br />Melee only — no slingshot</div>
                    <div className="text-[10px] text-red-400/50 uppercase tracking-wider">+ 1 Ally Hunter</div>
                  </button>
                  <button onClick={() => handleSelectRole("runner")}
                    className="group px-8 py-7 bg-blue-950/50 hover:bg-blue-900/60 text-white rounded-2xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-200 hover:scale-105 active:scale-95 space-y-3 w-52">
                    <div className="text-5xl group-hover:scale-110 transition-transform">🏃</div>
                    <div className="text-xl font-black">RUNNER</div>
                    <div className="text-xs text-white/40 leading-relaxed">Survive & reach the portal<br />Slingshot with 3 ammo</div>
                    <div className="text-[10px] text-blue-400/50 uppercase tracking-wider">Ammo spawns every 10s</div>
                  </button>
                </div>
                <button onClick={() => { setTransitioning(true); setTimeout(() => { setMenuStep("shop"); setTransitioning(false); }, 300); }}
                  className="mt-4 px-6 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all text-sm font-bold">
                  🛒 Shop & Powerups
                </button>
              </div>
            )}

            {/* Step: Shop */}
            {menuStep === "shop" && (
              <Shop onBack={handleBack} />
            )}

            {/* Step: Map */}
            {menuStep === "map" && (
              <div className="animate-fade-in space-y-6">
                <p className="text-lg text-white/60 font-medium">Choose your arena</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {(Object.keys(MAP_INFO) as GameMap[]).map((m) => {
                    const info = MAP_INFO[m];
                    return (
                      <button key={m} onClick={() => handleSelectMap(m)}
                        className={`group px-5 py-5 ${info.color} text-white rounded-2xl border ${info.borderColor} transition-all duration-200 hover:scale-105 active:scale-95 space-y-2 w-36`}>
                        <div className="text-4xl group-hover:scale-110 transition-transform">{info.emoji}</div>
                        <div className="text-sm font-black">{info.name}</div>
                        <div className="text-[10px] text-white/40 leading-relaxed">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleBack}
                  className="text-white/20 text-xs hover:text-white/50 underline transition-colors mt-2">← Change role</button>
              </div>
            )}

            {/* Step: Ready */}
            {menuStep === "ready" && (
              <div className="animate-fade-in space-y-5">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 max-w-md mx-auto">
                  <p className="text-white/70 leading-relaxed text-sm">
                    {role === "hunter"
                      ? "Hunt all 7 runners! Tag them up close for instant elimination. Your ally hunter helps the chase. Medkits spawn every 30s."
                      : "Evade 3 hunters for 60 seconds, then reach the portal! Shoot back with your slingshot (3 ammo, more spawns every 10s). Being tagged = instant KO!"}
                  </p>
                </div>
                <div className="cursor-pointer group" onClick={() => document.body.requestPointerLock()}>
                  <p className="text-white/90 text-xl font-bold group-hover:text-white transition-colors">
                    🎮 Click to Start
                  </p>
                </div>
                <div className="flex gap-4 justify-center text-white/40 text-xs flex-wrap">
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">WASD</kbd> Move</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">Shift</kbd> Sprint</span>
                  <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">Mouse</kbd> Look</span>
                  {role === "runner" && <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/60 font-mono">LMB</kbd> Shoot</span>}
                </div>
                <button onClick={handleBack}
                  className="text-white/20 text-xs hover:text-white/50 underline mt-3 transition-colors">← Change map</button>
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
