import { useState } from "react";
import { POWERUPS } from "./ShopData";
import { useGame } from "./GameState";
import { encodeSave, decodeSave } from "./SaveSystem";

interface ShopProps {
  onBack: () => void;
}

export default function Shop({ onBack }: ShopProps) {
  const { coins, ownedPowerups, buyPowerup, loadSaveData } = useGame();
  const [saveCode, setSaveCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [loadError, setLoadError] = useState("");
  const [justBought, setJustBought] = useState<string | null>(null);

  const handleBuy = (id: string) => {
    if (buyPowerup(id)) {
      setJustBought(id);
      setTimeout(() => setJustBought(null), 600);
    }
  };

  const handleGenerateCode = () => {
    const code = encodeSave({ coins, powerups: ownedPowerups });
    setGeneratedCode(code);
    setShowCode(true);
  };

  const handleLoadCode = () => {
    const data = decodeSave(saveCode);
    if (data) {
      loadSaveData(data);
      setLoadError("");
      setSaveCode("");
    } else {
      setLoadError("Invalid code!");
    }
  };

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl mx-auto">
      {/* Coin balance */}
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl">🪙</span>
        <span className="text-3xl font-black text-yellow-400 tabular-nums">{coins}</span>
        <span className="text-white/40 text-sm uppercase tracking-wider">coins</span>
      </div>

      {/* Powerup grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POWERUPS.map((p) => {
          const owned = ownedPowerups.includes(p.id);
          const canAfford = coins >= p.cost;
          const buying = justBought === p.id;
          return (
            <div key={p.id} className={`relative rounded-xl border p-3 text-center transition-all duration-200 ${
              owned
                ? "bg-green-950/40 border-green-500/30"
                : canAfford
                  ? "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                  : "bg-white/[0.02] border-white/5 opacity-60"
            } ${buying ? "scale-95" : ""}`}>
              <div className="text-3xl mb-1">{p.emoji}</div>
              <div className="text-xs font-bold text-white mb-0.5">{p.name}</div>
              <div className="text-[10px] text-white/40 leading-tight mb-2">{p.description}</div>
              {owned ? (
                <div className="text-green-400 text-xs font-bold">✓ Owned</div>
              ) : (
                <button
                  onClick={() => handleBuy(p.id)}
                  disabled={!canAfford}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    canAfford
                      ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
                      : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                  }`}
                >
                  🪙 {p.cost}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Save/Load codes */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
        <div className="text-xs text-white/40 uppercase tracking-wider text-center">Save & Load Progress</div>
        <div className="flex gap-2 justify-center">
          <button onClick={handleGenerateCode}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg text-xs font-bold transition-all border border-white/10">
            📋 Get Save Code
          </button>
        </div>
        {showCode && generatedCode && (
          <div className="space-y-1">
            <input readOnly value={generatedCode}
              className="w-full bg-black/50 text-white/80 text-xs font-mono px-3 py-2 rounded-lg border border-white/10 text-center select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()} />
            <p className="text-[10px] text-white/30 text-center">Copy this code to save your progress</p>
          </div>
        )}
        <div className="flex gap-2">
          <input value={saveCode} onChange={(e) => { setSaveCode(e.target.value); setLoadError(""); }}
            placeholder="Paste save code here..."
            className="flex-1 bg-black/50 text-white/80 text-xs font-mono px-3 py-2 rounded-lg border border-white/10" />
          <button onClick={handleLoadCode} disabled={!saveCode.trim()}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold transition-all border border-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed">
            Load
          </button>
        </div>
        {loadError && <p className="text-red-400 text-xs text-center">{loadError}</p>}
      </div>

      <button onClick={onBack}
        className="text-white/20 text-xs hover:text-white/50 underline transition-colors">← Back to menu</button>
    </div>
  );
}
