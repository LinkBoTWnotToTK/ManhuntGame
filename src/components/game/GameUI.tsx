import { useState, useEffect } from "react";
import { useGame, Role, GameMap, Difficulty, GameMode, DIFFICULTY_SETTINGS, GAME_MODES } from "./GameState";
import Shop from "./Shop";
import { xpForLevel, prestigeMultiplier } from "./SaveSystem";
import { TUTORIAL_STEPS } from "./Tutorial";

function formatTime(secs: number) {
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${mins}:${s.toString().padStart(2, "0")}`;
}

const MAP_INFO: Record<GameMap, { name: string; emoji: string; desc: string; color: string; borderColor: string }> = {
  suburban:       { name: "SUBURBAN", emoji: "🏡", desc: "House & garden with trees", color: "bg-emerald-950/50 hover:bg-emerald-900/60", borderColor: "border-emerald-500/20 hover:border-emerald-500/50" },
  industrial:     { name: "INDUSTRIAL", emoji: "🏭", desc: "Warehouse with containers", color: "bg-orange-950/50 hover:bg-orange-900/60", borderColor: "border-orange-500/20 hover:border-orange-500/50" },
  forest:         { name: "FOREST", emoji: "🌲", desc: "Woodland clearing", color: "bg-teal-950/50 hover:bg-teal-900/60", borderColor: "border-teal-500/20 hover:border-teal-500/50" },
  arctic:         { name: "ARCTIC", emoji: "❄️", desc: "Frozen tundra", color: "bg-cyan-950/50 hover:bg-cyan-900/60", borderColor: "border-cyan-500/20 hover:border-cyan-500/50" },
  underground:    { name: "UNDERGROUND", emoji: "🕳️", desc: "Bunker tunnels", color: "bg-purple-950/50 hover:bg-purple-900/60", borderColor: "border-purple-500/20 hover:border-purple-500/50" },
  volcano:        { name: "VOLCANO", emoji: "🌋", desc: "Molten lava caverns", color: "bg-red-950/50 hover:bg-red-900/60", borderColor: "border-red-500/20 hover:border-red-500/50" },
  space_station:  { name: "SPACE STATION", emoji: "🚀", desc: "Sci-fi corridors", color: "bg-indigo-950/50 hover:bg-indigo-900/60", borderColor: "border-indigo-500/20 hover:border-indigo-500/50" },
};

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: "border-green-500/30 bg-green-950/40 hover:bg-green-900/50 text-green-300",
  medium: "border-yellow-500/30 bg-yellow-950/40 hover:bg-yellow-900/50 text-yellow-300",
  hard: "border-red-500/30 bg-red-950/40 hover:bg-red-900/50 text-red-300",
};

export default function GameUI() {
  const {
    role, selectedMap, difficulty, gameMode,
    score, totalNPCs, elapsedTime, timeLeft, gameOver, gameResult,
    isPlaying, escapeOpen, stamina, maxStamina, playerHealth, playerAmmo, maxHealth,
    coins, matchCoins, currentWeapon,
    level, xp, prestige, totalWins, totalGames, leaderboard,
    kothScore, checkpointIndex, survivalWave, flagCarried, isDisguised,
    selectRole, selectMap, setDifficulty, setGameMode, startGame, resetGame,
    startTutorial,
  } = useGame();

  const [menuStep, setMenuStep] = useState<"main" | "play" | "shop" | "leaderboard" | "mode" | "difficulty" | "map" | "ready">("main");
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
    if (!role && !selectedMap) setMenuStep("main");
  }, [role, selectedMap]);

  const transition = (next: typeof menuStep, cb?: () => void) => {
    setTransitioning(true);
    cb?.();
    setTimeout(() => { setMenuStep(next); setTransitioning(false); }, 250);
  };

  const handleSelectRole = (r: Role) => transition("mode", () => selectRole(r));
  const handleSelectMode = (m: GameMode) => transition("difficulty", () => setGameMode(m));
  const handleSelectDifficulty = (d: Difficulty) => transition("map", () => setDifficulty(d));
  const handleSelectMap = (m: GameMap) => transition("ready", () => selectMap(m));

  const handleBack = () => {
    setTransitioning(true);
    const flow: Record<string, string> = {
      shop: "main", leaderboard: "main", play: "main",
      mode: "play", difficulty: "mode", map: "difficulty", ready: "map",
    };
    const prev = flow[menuStep] || "main";
    if (prev === "main" || prev === "play") { selectRole(null as unknown as Role); selectMap(null as unknown as GameMap); }
    if (prev === "map") selectMap(null as unknown as GameMap);
    setTimeout(() => { setMenuStep(prev as typeof menuStep); setTransitioning(false); }, 250);
  };

  const staminaPct = (stamina / maxStamina) * 100;
  const staminaColor = staminaPct > 50 ? "#00cc66" : staminaPct > 20 ? "#ffaa00" : "#ff3333";
  const showMenu = !isPlaying && !gameOver;
  const xpNeeded = xpForLevel(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);

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

          {/* Top-left: Hearts + Role */}
          <div className="fixed top-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 shadow-2xl space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{role === "hunter" ? "🏹" : "🏃"}</span>
                <div>
                  {role === "hunter" ? (
                    <div className="text-white font-bold text-lg tabular-nums">{score}/{totalNPCs}</div>
                  ) : gameMode === "koth" ? (
                    <div className="text-yellow-400 font-bold text-lg tabular-nums">👑 {kothScore}/100</div>
                  ) : gameMode === "speedrun" || gameMode === "parkour" || gameMode === "deathrun" ? (
                    <div className="text-cyan-400 font-bold text-lg tabular-nums">⚡ {checkpointIndex}/5</div>
                  ) : gameMode === "collector" ? (
                    <div className="text-yellow-400 font-bold text-lg tabular-nums">🪙 {matchCoins}</div>
                  ) : gameMode === "survival" ? (
                    <div className="text-red-400 font-bold text-lg tabular-nums">🛡️ Wave {survivalWave}</div>
                  ) : gameMode === "ctf" ? (
                    <div className="text-red-400 font-bold text-lg tabular-nums">{flagCarried ? "🚩 RETURN FLAG!" : "🚩 Find Flag"}</div>
                  ) : gameMode === "blockhunt" ? (
                    <div className="text-purple-400 font-bold text-lg tabular-nums">{isDisguised ? "📦 Hidden" : "🏃 Exposed"}</div>
                  ) : (
                    <div className="text-white font-bold text-lg">SURVIVE</div>
                  )}
                  <div className="text-white/30 text-[9px] uppercase tracking-[0.15em]">{GAME_MODES[gameMode].name} • {DIFFICULTY_SETTINGS[difficulty].label}</div>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: maxHealth }, (_, i) => (
                  <span key={i} className={`text-lg transition-all ${i < playerHealth ? "opacity-100" : "opacity-15 grayscale"}`}>❤️</span>
                ))}
              </div>
              {/* Level badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/30 font-bold">LV {level}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400/60 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
                </div>
                {prestige > 0 && <span className="text-[9px] text-yellow-400">★{prestige}</span>}
              </div>
            </div>
          </div>

          {/* Top-right: Weapon */}
          {role === "runner" && (
            <div className="fixed top-4 right-4 z-50 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 shadow-2xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentWeapon === "slingshot" ? "🪃" : currentWeapon === "shotgun" ? "💥" : "🎯"}</span>
                  <div>
                    <div className="text-white font-bold text-lg tabular-nums">{playerAmmo}</div>
                    <div className="text-white/30 text-[9px] uppercase tracking-[0.15em]">
                      {currentWeapon === "slingshot" ? "Slingshot" : currentWeapon === "shotgun" ? "Scatter" : "Sniper"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {([["1","slingshot","🪃"],["2","shotgun","💥"],["3","sniper","🎯"]] as const).map(([key,id,emoji]) => (
                    <div key={id} className={`text-[10px] px-1 py-0.5 rounded border ${currentWeapon === id ? "border-white/30 bg-white/10 text-white" : "border-white/5 text-white/20"}`}>
                      <kbd className="font-mono text-[8px] mr-0.5">{key}</kbd>{emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {role === "hunter" && (
            <div className="fixed top-4 right-4 z-50 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚔️</span>
                  <div><div className="text-white font-bold text-sm">Melee</div><div className="text-white/30 text-[9px]">LMB</div></div>
                </div>
              </div>
            </div>
          )}

          {/* Coin counter */}
          <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-yellow-500/20 flex items-center gap-2">
              <span className="text-sm">🪙</span>
              <span className="text-yellow-400 font-bold text-sm tabular-nums">{coins}</span>
              {matchCoins > 0 && <span className="text-yellow-400/40 text-[10px]">(+{matchCoins})</span>}
            </div>
          </div>

          {/* Timer */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-2.5 border border-white/10 shadow-2xl">
              <div className={`font-mono text-xl font-black tracking-wider text-center tabular-nums ${
                timeLeft <= 10 ? "text-red-400 animate-pulse" : timeLeft <= 20 ? "text-yellow-400" : "text-white"
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-white/30 text-[9px] uppercase tracking-[0.15em] text-center">
                {escapeOpen ? "⚡ ESCAPE OPEN" : "Until Escape"}
              </div>
            </div>
          </div>

          {/* Stamina */}
          <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/5 w-32">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] text-white/30 uppercase">Stamina</span>
                <kbd className="text-[8px] px-1 bg-white/10 rounded text-white/40 ml-auto">⇧</kbd>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-150" style={{ width: `${staminaPct}%`, backgroundColor: staminaColor }} />
              </div>
            </div>
          </div>

          {/* Escape alerts */}
          {escapeOpen && role === "runner" && (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-green-950/90 backdrop-blur-md rounded-full px-5 py-1.5 border border-green-500/50 shadow-[0_0_20px_rgba(0,255,68,0.3)]">
                <span className="text-green-400 font-bold text-xs uppercase tracking-wider animate-pulse">🚪 RUN TO THE PORTAL!</span>
              </div>
            </div>
          )}
          {/* Block Hunt disguise alert */}
          {gameMode === "blockhunt" && isDisguised && (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-purple-950/90 backdrop-blur-md rounded-full px-5 py-1.5 border border-purple-500/50 shadow-[0_0_20px_rgba(128,0,255,0.3)]">
                <span className="text-purple-300 font-bold text-xs uppercase tracking-wider">📦 DISGUISED — Don&apos;t move!</span>
              </div>
            </div>
          )}
          {/* CTF flag carried */}
          {gameMode === "ctf" && flagCarried && (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-950/90 backdrop-blur-md rounded-full px-5 py-1.5 border border-red-500/50 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
                <span className="text-red-400 font-bold text-xs uppercase tracking-wider animate-pulse">🚩 RETURN TO BASE!</span>
              </div>
            </div>
          )}
          {/* Survival wave */}
          {gameMode === "survival" && (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-950/80 backdrop-blur-md rounded-full px-5 py-1.5 border border-red-500/30">
                <span className="text-red-300 font-bold text-xs uppercase tracking-wider">🛡️ WAVE {survivalWave}</span>
              </div>
            </div>
          )}
          {escapeOpen && role === "hunter" && (
            <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-950/90 backdrop-blur-md rounded-full px-5 py-1.5 border border-red-500/50">
                <span className="text-red-400 font-bold text-xs uppercase tracking-wider animate-pulse">⚠️ RUNNERS ESCAPING!</span>
              </div>
            </div>
          )}

          {/* Progress (hunter) */}
          {role === "hunter" && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-64">
              <div className="bg-black/50 backdrop-blur-md rounded-full p-0.5 border border-white/10">
                <div className="h-2 rounded-full transition-all duration-500 ease-out" style={{
                  width: `${(score / totalNPCs) * 100}%`,
                  background: "linear-gradient(90deg, #ff4444, #ff8800, #ffcc00)",
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
          <div className="text-center space-y-4 animate-scale-in max-w-sm">
            <div className="text-6xl mb-1">{gameResult === "win" ? "🏆" : "💀"}</div>
            <h1 className="text-5xl font-black text-white tracking-tight">
              {gameResult === "win" ? "VICTORY" : "DEFEATED"}
            </h1>
            <p className="text-xl text-white/50 font-mono tabular-nums">{formatTime(elapsedTime)}</p>
            <div className="text-white/30 text-xs">{GAME_MODES[gameMode].name} • {DIFFICULTY_SETTINGS[difficulty].label}</div>

            {/* XP + Coin summary */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Coins collected</span><span className="text-yellow-400 font-bold">🪙 {matchCoins}</span></div>
              <div className="flex justify-between"><span className="text-white/40">{gameResult === "win" ? "Win bonus" : "Consolation"}</span><span className="text-yellow-400 font-bold">🪙 {gameResult === "win" ? Math.floor(5 * DIFFICULTY_SETTINGS[difficulty].coinMult * prestigeMultiplier(prestige)) : Math.floor(2 * DIFFICULTY_SETTINGS[difficulty].coinMult * prestigeMultiplier(prestige))}</span></div>
              <div className="flex justify-between"><span className="text-cyan-400/40">XP earned</span><span className="text-cyan-400 font-bold">+{Math.floor((gameResult === "win" ? 30 : 10) * DIFFICULTY_SETTINGS[difficulty].xpMult * prestigeMultiplier(prestige))}</span></div>
              <div className="border-t border-white/10 pt-1 flex justify-between">
                <span className="text-white/50 font-bold">Level {level}</span>
                <span className="text-yellow-300 font-black">🪙 {coins}</span>
              </div>
              {prestige > 0 && <div className="text-yellow-500/40 text-[10px] text-center">★ Prestige {prestige} (×{prestigeMultiplier(prestige).toFixed(2)} multiplier)</div>}
            </div>

            <button
              onClick={() => { resetGame(); window.location.reload(); }}
              className="mt-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 font-bold transition-all hover:scale-105 active:scale-95"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* === MAIN MENU === */}
      {showMenu && (
        <div className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(20,20,40,0.98) 0%, rgba(5,5,15,0.99) 100%)" }}>
          <div className={`text-center w-full max-w-4xl px-6 transition-all duration-250 ${transitioning ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}>

            {/* Header — always visible */}
            <div className="mb-6">
              <h1 className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight mb-1"
                style={{ textShadow: "0 0 60px rgba(100,150,255,0.15)" }}>
                HIDE & SEEK
              </h1>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.5em] mb-3">Third Person Combat</p>

              {/* Stats bar */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                  <span>🪙</span><span className="text-yellow-400 font-bold tabular-nums">{coins}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                  <span className="text-cyan-400 font-bold">LV {level}</span>
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${xpPct}%` }} />
                  </div>
                </div>
                {prestige > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-500/10 rounded-lg px-3 py-1.5 border border-yellow-500/20">
                    <span className="text-yellow-400 font-bold">★{prestige}</span>
                    <span className="text-yellow-400/40 text-[9px]">×{prestigeMultiplier(prestige).toFixed(1)}</span>
                  </div>
                )}
                <div className="text-white/20 text-[10px]">{totalWins}W / {totalGames}G</div>
              </div>
            </div>

            {/* MAIN MENU */}
            {menuStep === "main" && (
              <div className="animate-fade-in space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                  <button onClick={() => transition("play")}
                    className="group p-5 bg-gradient-to-b from-blue-900/40 to-blue-950/60 text-white rounded-2xl border border-blue-500/20 hover:border-blue-400/50 transition-all hover:scale-105 active:scale-95 space-y-2">
                    <div className="text-3xl group-hover:scale-110 transition-transform">🎮</div>
                    <div className="text-sm font-black">PLAY</div>
                  </button>
                  <button onClick={() => transition("shop")}
                    className="group p-5 bg-gradient-to-b from-yellow-900/40 to-yellow-950/60 text-white rounded-2xl border border-yellow-500/20 hover:border-yellow-400/50 transition-all hover:scale-105 active:scale-95 space-y-2">
                    <div className="text-3xl group-hover:scale-110 transition-transform">🛒</div>
                    <div className="text-sm font-black">SHOP</div>
                  </button>
                  <button onClick={() => transition("leaderboard")}
                    className="group p-5 bg-gradient-to-b from-purple-900/40 to-purple-950/60 text-white rounded-2xl border border-purple-500/20 hover:border-purple-400/50 transition-all hover:scale-105 active:scale-95 space-y-2">
                    <div className="text-3xl group-hover:scale-110 transition-transform">🏅</div>
                    <div className="text-sm font-black">SCORES</div>
                  </button>
                  <button onClick={() => transition("shop")}
                    className="group p-5 bg-gradient-to-b from-emerald-900/40 to-emerald-950/60 text-white rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 transition-all hover:scale-105 active:scale-95 space-y-2">
                    <div className="text-3xl group-hover:scale-110 transition-transform">⚙️</div>
                    <div className="text-sm font-black">SAVE</div>
                  </button>
                </div>
              </div>
            )}

            {/* PLAY: Role select */}
            {menuStep === "play" && (
              <div className="animate-fade-in space-y-5">
                <p className="text-base text-white/50 font-medium">Choose your role</p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => handleSelectRole("hunter")}
                    className="group px-7 py-6 bg-gradient-to-b from-red-900/50 to-red-950/70 text-white rounded-2xl border border-red-500/20 hover:border-red-400/50 transition-all hover:scale-105 active:scale-95 space-y-2 w-48">
                    <div className="text-4xl group-hover:scale-110 transition-transform">🏹</div>
                    <div className="text-lg font-black">HUNTER</div>
                    <div className="text-[10px] text-white/30 leading-relaxed">Tag & eliminate runners<br/>Melee combat</div>
                  </button>
                  <button onClick={() => handleSelectRole("runner")}
                    className="group px-7 py-6 bg-gradient-to-b from-blue-900/50 to-blue-950/70 text-white rounded-2xl border border-blue-500/20 hover:border-blue-400/50 transition-all hover:scale-105 active:scale-95 space-y-2 w-48">
                    <div className="text-4xl group-hover:scale-110 transition-transform">🏃</div>
                    <div className="text-lg font-black">RUNNER</div>
                    <div className="text-[10px] text-white/30 leading-relaxed">Survive & escape<br/>3 weapon types</div>
                  </button>
                </div>
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
              </div>
            )}

            {/* MODE SELECT */}
            {menuStep === "mode" && (
              <div className="animate-fade-in space-y-5">
                <p className="text-base text-white/50 font-medium">Game Mode</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
                  {(Object.keys(GAME_MODES) as GameMode[]).map(m => {
                    const info = GAME_MODES[m];
                    return (
                      <button key={m} onClick={() => handleSelectMode(m)}
                        className="group p-4 bg-white/[0.03] hover:bg-white/[0.07] text-white rounded-xl border border-white/10 hover:border-white/25 transition-all hover:scale-[1.03] active:scale-95 space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{info.emoji}</span>
                          <span className="text-xs font-black uppercase">{info.name}</span>
                        </div>
                        <div className="text-[9px] text-white/30 leading-relaxed">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
              </div>
            )}

            {/* DIFFICULTY */}
            {menuStep === "difficulty" && (
              <div className="animate-fade-in space-y-5">
                <p className="text-base text-white/50 font-medium">Difficulty</p>
                <div className="flex gap-3 justify-center">
                  {(["easy","medium","hard"] as Difficulty[]).map(d => {
                    const s = DIFFICULTY_SETTINGS[d];
                    return (
                      <button key={d} onClick={() => handleSelectDifficulty(d)}
                        className={`group p-5 rounded-2xl border transition-all hover:scale-105 active:scale-95 space-y-1.5 w-40 ${DIFF_COLORS[d]}`}>
                        <div className="text-2xl">{d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"}</div>
                        <div className="text-sm font-black uppercase">{s.label}</div>
                        <div className="text-[9px] opacity-60 leading-relaxed">
                          {s.hunterCount} hunters • {s.gameDuration}s<br/>
                          ×{s.coinMult} coins • ×{s.xpMult} XP
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
              </div>
            )}

            {/* MAP SELECT */}
            {menuStep === "map" && (
              <div className="animate-fade-in space-y-5">
                <p className="text-base text-white/50 font-medium">Choose your arena</p>
                <div className="flex gap-2.5 justify-center flex-wrap">
                  {(Object.keys(MAP_INFO) as GameMap[]).map(m => {
                    const info = MAP_INFO[m];
                    return (
                      <button key={m} onClick={() => handleSelectMap(m)}
                        className={`group px-4 py-4 ${info.color} text-white rounded-xl border ${info.borderColor} transition-all hover:scale-105 active:scale-95 space-y-1.5 w-28`}>
                        <div className="text-3xl group-hover:scale-110 transition-transform">{info.emoji}</div>
                        <div className="text-[10px] font-black">{info.name}</div>
                        <div className="text-[8px] text-white/30 leading-relaxed">{info.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
              </div>
            )}

            {/* SHOP */}
            {menuStep === "shop" && <Shop onBack={handleBack} />}

            {/* LEADERBOARD */}
            {menuStep === "leaderboard" && (
              <div className="animate-fade-in space-y-4 max-w-md mx-auto">
                <p className="text-base text-white/50 font-medium">Recent Games</p>
                {leaderboard.length === 0 ? (
                  <p className="text-white/20 text-sm py-8">No games played yet</p>
                ) : (
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {leaderboard.slice(0, 20).map((e, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${
                        e.result === "win" ? "bg-green-950/30 border-green-500/10" : "bg-red-950/30 border-red-500/10"
                      }`}>
                        <span className="text-lg">{e.result === "win" ? "🏆" : "💀"}</span>
                        <div className="flex-1 text-left">
                          <div className="text-white/70 font-bold">{GAME_MODES[e.mode as GameMode]?.name || e.mode}</div>
                          <div className="text-white/30 text-[9px]">{e.role} • {e.map} • {e.difficulty}</div>
                        </div>
                        <div className="text-white/50 font-mono tabular-nums">{formatTime(e.time)}</div>
                        <div className="text-white/20 text-[9px]">{new Date(e.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
              </div>
            )}

            {/* READY */}
            {menuStep === "ready" && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-2xl">{role === "hunter" ? "🏹" : "🏃"}</span>
                    <span className="text-xl">{GAME_MODES[gameMode].emoji}</span>
                    <span className="text-2xl">{MAP_INFO[selectedMap!]?.emoji}</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    {gameMode === "classic" && role === "hunter" && `Hunt all 7 runners in ${DIFFICULTY_SETTINGS[difficulty].gameDuration}s. Melee to tag.`}
                    {gameMode === "classic" && role === "runner" && `Evade ${DIFFICULTY_SETTINGS[difficulty].hunterCount} hunters, escape through the portal.`}
                    {gameMode === "infection" && "Tagged runners convert to hunters. Be the last runner standing!"}
                    {gameMode === "koth" && "Stand in the golden zone to score. First to 100 wins!"}
                    {gameMode === "lms" && "Free-for-all. Eliminate all opponents to win!"}
                    {gameMode === "speedrun" && "Race through 5 checkpoints as fast as possible!"}
                    {gameMode === "collector" && "Grab as many coins as you can before time runs out!"}
                    {gameMode === "parkour" && "Jump across platforms to reach all 5 checkpoints! Press SPACE to jump."}
                    {gameMode === "blockhunt" && "Press Q to disguise as a crate. Stay hidden from seekers! Don't move while disguised."}
                    {gameMode === "ctf" && "Find the enemy flag and bring it back to your base!"}
                    {gameMode === "survival" && "Survive endless waves of hunters. Each wave adds more!"}
                    {gameMode === "deathrun" && "Navigate deadly narrow platforms to reach all 5 checkpoints! Don't fall!"}
                  </p>
                </div>
                <div className="cursor-pointer group" onClick={() => document.body.requestPointerLock()}>
                  <p className="text-white/80 text-lg font-bold group-hover:text-white transition-colors">🎮 Click to Start</p>
                </div>
                <div className="flex gap-3 justify-center text-white/30 text-[10px] flex-wrap">
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">WASD</kbd> Move</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">⇧</kbd> Sprint</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">SPACE</kbd> Jump</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">LMB</kbd> {role === "runner" ? "Shoot" : "Melee"}</span>
                  {role === "runner" && <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">1/2/3</kbd> Weapons</span>}
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">E</kbd> Grab</span>
                  {gameMode === "blockhunt" && <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/50 font-mono text-[9px]">Q</kbd> Disguise</span>}
                </div>
                <button onClick={handleBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
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
      <div className="text-3xl font-black text-red-400 drop-shadow-[0_0_30px_rgba(255,60,60,0.9)] uppercase tracking-wider">
        ELIMINATED! 🎯
      </div>
    </div>
  );
}
