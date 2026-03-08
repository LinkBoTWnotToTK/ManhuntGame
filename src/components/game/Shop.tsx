import { useState } from "react";
import { POWERUPS } from "./ShopData";
import { useGame } from "./GameState";
import { encodeSave, decodeSave, xpForLevel, prestigeMultiplier } from "./SaveSystem";

interface ShopProps {
  onBack: () => void;
}

export default function Shop({ onBack }: ShopProps) {
  const {
    coins, ownedPowerups, buyPowerup, loadSaveData, level, xp, prestige,
    totalWins, totalGames, doPrestige, equippedSkin, equippedTrail, equippedHat,
    equipSkin, equipTrail, equipHat,
  } = useGame();
  const [saveCode, setSaveCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [loadError, setLoadError] = useState("");
  const [justBought, setJustBought] = useState<string | null>(null);
  const [tab, setTab] = useState<"powerups" | "skins" | "trails" | "hats" | "prestige" | "save">("powerups");

  const handleBuy = (id: string) => {
    if (buyPowerup(id)) {
      setJustBought(id);
      setTimeout(() => setJustBought(null), 600);
    }
  };

  const handleGenerateCode = () => {
    const code = encodeSave({
      coins, powerups: ownedPowerups, level, xp, prestige, totalWins, totalGames,
      equippedSkin, equippedTrail, equippedHat,
    });
    setGeneratedCode(code);
    setShowCode(true);
  };

  const handleLoadCode = () => {
    const data = decodeSave(saveCode);
    if (data) { loadSaveData(data); setLoadError(""); setSaveCode(""); }
    else setLoadError("Invalid code!");
  };

  const powerups = POWERUPS.filter(p => p.category === "powerup");
  const skins = POWERUPS.filter(p => p.category === "skin");
  const trails = POWERUPS.filter(p => p.category === "trail");
  const hats = POWERUPS.filter(p => p.category === "hat");

  const renderItems = (items: typeof POWERUPS, equippedId?: string, equipFn?: (id: string) => void) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {items.map(p => {
        const owned = ownedPowerups.includes(p.id);
        const canAfford = coins >= p.cost;
        const isEquipped = equippedId === p.id;
        return (
          <div key={p.id} className={`relative rounded-xl border p-2.5 text-center transition-all ${
            isEquipped ? "bg-blue-950/50 border-blue-400/40 ring-1 ring-blue-400/30"
              : owned ? "bg-green-950/40 border-green-500/30"
              : canAfford ? "bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/8"
              : "bg-white/[0.02] border-white/5 opacity-50"
          } ${justBought === p.id ? "scale-95" : ""}`}>
            <div className="text-2xl mb-0.5">{p.emoji}</div>
            <div className="text-[10px] font-bold text-white mb-0.5">{p.name}</div>
            <div className="text-[8px] text-white/30 leading-tight mb-1.5">{p.description}</div>
            {isEquipped ? (
              <div className="text-blue-400 text-[10px] font-bold">✦ Equipped</div>
            ) : owned && equipFn ? (
              <button onClick={() => equipFn(p.id)}
                className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all">
                Equip
              </button>
            ) : owned ? (
              <div className="text-green-400 text-[10px] font-bold">✓ Owned</div>
            ) : (
              <button onClick={() => handleBuy(p.id)} disabled={!canAfford}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  canAfford ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
                    : "bg-white/5 text-white/15 cursor-not-allowed border border-white/5"
                }`}>🪙 {p.cost}</button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl">🪙</span>
        <span className="text-2xl font-black text-yellow-400 tabular-nums">{coins}</span>
        {prestige > 0 && <span className="text-yellow-500/50 text-xs">★{prestige} (×{prestigeMultiplier(prestige).toFixed(1)})</span>}
      </div>

      <div className="flex gap-1 justify-center flex-wrap">
        {([
          ["powerups", "⚡ Power"],
          ["skins", "🎨 Skins"],
          ["trails", "✨ Trails"],
          ["hats", "🎩 Hats"],
          ["prestige", "★ Prestige"],
          ["save", "💾 Save"],
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              tab === id ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-white/30 hover:text-white/50"
            }`}>{label}</button>
        ))}
      </div>

      {tab === "powerups" && renderItems(powerups)}
      {tab === "skins" && renderItems(skins, equippedSkin, equipSkin)}
      {tab === "trails" && renderItems(trails, equippedTrail, equipTrail)}
      {tab === "hats" && renderItems(hats, equippedHat, equipHat)}

      {tab === "prestige" && (
        <div className="space-y-4 max-w-xs mx-auto">
          <div className="bg-gradient-to-b from-yellow-900/20 to-yellow-950/40 rounded-xl p-5 border border-yellow-500/20 space-y-3 text-center">
            <div className="text-4xl">⭐</div>
            <div className="text-lg font-black text-yellow-400">Prestige {prestige}</div>
            <div className="text-xs text-white/40 leading-relaxed">
              Reset your level and powerups for a permanent<br/>
              <span className="text-yellow-300 font-bold">+25% coin & XP multiplier</span>
            </div>
            <div className="text-white/30 text-[10px]">
              Current: ×{prestigeMultiplier(prestige).toFixed(2)} | Next: ×{prestigeMultiplier(prestige + 1).toFixed(2)}
            </div>
            {level >= 10 ? (
              <button onClick={doPrestige}
                className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg text-sm font-bold border border-yellow-500/30 transition-all hover:scale-105">
                ★ Prestige Now
              </button>
            ) : (
              <div className="text-white/20 text-xs">Reach level 10 to prestige (currently {level})</div>
            )}
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center space-y-1">
            <div className="text-white/50 text-xs font-bold">Stats</div>
            <div className="text-white/30 text-[10px]">Level {level} • {xp}/{xpForLevel(level)} XP</div>
            <div className="text-white/30 text-[10px]">{totalWins} wins / {totalGames} games ({totalGames > 0 ? Math.round((totalWins/totalGames)*100) : 0}% WR)</div>
          </div>
        </div>
      )}

      {tab === "save" && (
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="text-xs text-white/40 uppercase tracking-wider text-center">Save & Load Progress</div>
            <button onClick={handleGenerateCode}
              className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-xs font-bold transition-all border border-white/10">
              📋 Get Save Code
            </button>
            {showCode && generatedCode && (
              <div className="space-y-1">
                <input readOnly value={generatedCode}
                  className="w-full bg-black/50 text-white/80 text-[10px] font-mono px-3 py-2 rounded-lg border border-white/10 text-center"
                  onClick={e => (e.target as HTMLInputElement).select()} />
                <p className="text-[9px] text-white/20 text-center">Copy this code to save your progress</p>
              </div>
            )}
            <div className="flex gap-2">
              <input value={saveCode} onChange={e => { setSaveCode(e.target.value); setLoadError(""); }}
                placeholder="Paste save code..."
                className="flex-1 bg-black/50 text-white/80 text-[10px] font-mono px-3 py-2 rounded-lg border border-white/10" />
              <button onClick={handleLoadCode} disabled={!saveCode.trim()}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30 disabled:opacity-30">Load</button>
            </div>
            {loadError && <p className="text-red-400 text-[10px] text-center">{loadError}</p>}
          </div>
        </div>
      )}

      <button onClick={onBack} className="text-white/15 text-xs hover:text-white/40 transition-colors">← Back</button>
    </div>
  );
}
