import { useState, useRef, useCallback, useEffect } from "react";
import { isMobilePlatform } from "./SharedState";
import {
  EditorCategory, EDITOR_CATALOG, EDITOR_THEMES, EditorTheme,
  PlacedItem, CustomLevel, saveCustomLevel, loadCustomLevels, deleteCustomLevel, generateUid,
} from "./LevelEditorData";

// ========== 2D Item shapes for top-down rendering ==========
const ITEM_SHAPES: Record<string, { w: number; h: number; color: string; label: string }> = {
  wall_short: { w: 4, h: 0.15, color: "#888", label: "Wall" },
  wall_tall: { w: 4, h: 0.15, color: "#777", label: "Tall" },
  wall_L: { w: 3, h: 0.15, color: "#999", label: "L" },
  container: { w: 3, h: 6, color: "#cc4444", label: "📦" },
  platform: { w: 4, h: 4, color: "#666", label: "Plat" },
  ramp: { w: 3, h: 5, color: "#888", label: "⬆" },
  crate: { w: 0.8, h: 0.8, color: "#8B6914", label: "📦" },
  barrel: { w: 0.6, h: 0.6, color: "#5a4020", label: "🛢" },
  box: { w: 0.6, h: 0.6, color: "#7a6a5a", label: "📥" },
  sack: { w: 0.7, h: 0.7, color: "#9a8a5a", label: "💰" },
  tire: { w: 0.6, h: 0.6, color: "#222", label: "⭕" },
  icebox: { w: 0.65, h: 0.65, color: "#99bbdd", label: "🧊" },
  crate_stack: { w: 1.6, h: 0.8, color: "#8B6914", label: "🗄" },
  tree: { w: 3, h: 3, color: "#1a5a1a", label: "🌲" },
  snow_tree: { w: 3, h: 3, color: "#1a4a2a", label: "🎄" },
  lamppost: { w: 0.4, h: 0.4, color: "#ffffcc", label: "💡" },
  rock: { w: 1, h: 1, color: "#666655", label: "🪨" },
  ice_rock: { w: 1, h: 1, color: "#8899bb", label: "💎" },
  campfire: { w: 0.8, h: 0.8, color: "#ff6600", label: "🔥" },
  tent: { w: 3.6, h: 3.6, color: "#cc8844", label: "⛺" },
  igloo: { w: 3.6, h: 3.6, color: "#dde8f0", label: "🏠" },
  snowdrift: { w: 4, h: 3, color: "#e0e8f0", label: "❄" },
  sofa: { w: 2, h: 0.9, color: "#8844aa", label: "🛋" },
  coin_spawn: { w: 0.5, h: 0.5, color: "#ffd700", label: "🪙" },
  medkit_spawn: { w: 0.5, h: 0.5, color: "#ff4444", label: "❤" },
  ammo_spawn: { w: 0.5, h: 0.5, color: "#556633", label: "🎯" },
  hatch: { w: 1.8, h: 1.8, color: "#3a3a3a", label: "🕳" },
};

const GRID_SIZE = 0.5; // snap
const CANVAS_CELL = 16; // pixels per unit

// ========== Category Colors ==========
const CAT_COLORS: Record<EditorCategory, string> = {
  walls: "border-blue-500/30 bg-blue-950/50 hover:bg-blue-900/60",
  objects: "border-orange-500/30 bg-orange-950/50 hover:bg-orange-900/60",
  decor: "border-green-500/30 bg-green-950/50 hover:bg-green-900/60",
  items: "border-yellow-500/30 bg-yellow-950/50 hover:bg-yellow-900/60",
  hatches: "border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/60",
};

const CAT_LABELS: Record<EditorCategory, { emoji: string; name: string }> = {
  walls: { emoji: "🧱", name: "Walls" },
  objects: { emoji: "📦", name: "Objects" },
  decor: { emoji: "🌲", name: "Decor" },
  items: { emoji: "🪙", name: "Items" },
  hatches: { emoji: "🕳️", name: "Hatches" },
};

// ========== Main Editor Component (2D) ==========
export default function LevelEditor({ onExit }: { onExit: () => void }) {
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EditorCategory>("walls");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [theme, setTheme] = useState<EditorTheme>("grass");
  const [levelName, setLevelName] = useState("My Level");
  const [ghostRotation, setGhostRotation] = useState(0);
  const [savedLevels, setSavedLevels] = useState(loadCustomLevels());
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

  // Canvas pan/zoom
  const [camX, setCamX] = useState(0);
  const [camZ, setCamZ] = useState(-15);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const isDragging = useRef(false);
  const lastDrag = useRef<[number, number]>([0, 0]);

  // Keyboard shortcuts
  useEffect(() => {
    const keys = new Set<string>();
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "KeyR") setGhostRotation(prev => prev + Math.PI / 4);
      if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedUid) {
          setItems(prev => prev.filter(i => i.uid !== selectedUid));
          setSelectedUid(null);
        }
      }
      if (e.code === "Escape") {
        setSelectedTool(null);
        setSelectedUid(null);
      }
      keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    const interval = setInterval(() => {
      const speed = 2 / zoom;
      if (keys.has("KeyW") || keys.has("ArrowUp")) setCamZ(p => p - speed);
      if (keys.has("KeyS") || keys.has("ArrowDown")) setCamZ(p => p + speed);
      if (keys.has("KeyA") || keys.has("ArrowLeft")) setCamX(p => p - speed);
      if (keys.has("KeyD") || keys.has("ArrowRight")) setCamX(p => p + speed);
    }, 16);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(interval);
    };
  }, [selectedUid, zoom]);

  // Screen coords → world coords
  const screenToWorld = useCallback((sx: number, sy: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const cx = (sx - rect.left - rect.width / 2) / (CANVAS_CELL * zoom) + camX;
    const cz = (sy - rect.top - rect.height / 2) / (CANVAS_CELL * zoom) + camZ;
    return [
      Math.round(cx / GRID_SIZE) * GRID_SIZE,
      Math.round(cz / GRID_SIZE) * GRID_SIZE,
    ];
  }, [camX, camZ, zoom]);

  // World coords → screen coords
  const worldToScreen = useCallback((wx: number, wz: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const sx = (wx - camX) * CANVAS_CELL * zoom + canvas.width / 2;
    const sy = (wz - camZ) * CANVAS_CELL * zoom + canvas.height / 2;
    return [sx, sy];
  }, [camX, camZ, zoom]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const themeDef = EDITOR_THEMES.find(t => t.id === theme) || EDITOR_THEMES[0];
    const w = canvas.width;
    const h = canvas.height;
    const scale = CANVAS_CELL * zoom;

    // Background
    ctx.fillStyle = themeDef.groundColor;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    const startX = Math.floor((camX - w / 2 / scale) / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((camX + w / 2 / scale) / GRID_SIZE) * GRID_SIZE;
    const startZ = Math.floor((camZ - h / 2 / scale) / GRID_SIZE) * GRID_SIZE;
    const endZ = Math.ceil((camZ + h / 2 / scale) / GRID_SIZE) * GRID_SIZE;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const [sx] = worldToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let z = startZ; z <= endZ; z += GRID_SIZE) {
      const [, sy] = worldToScreen(0, z);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    // Origin marker
    const [ox, oy] = worldToScreen(0, 0);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw items
    for (const item of items) {
      const shape = ITEM_SHAPES[item.itemId] || { w: 1, h: 1, color: "#ff00ff", label: "?" };
      const isSelected = item.uid === selectedUid;
      const cos = Math.cos(item.rotation);
      const sin = Math.sin(item.rotation);

      const [sx, sy] = worldToScreen(item.position[0], item.position[2]);
      const pw = shape.w * scale * item.scale;
      const ph = shape.h * scale * item.scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(item.rotation);

      // Fill
      ctx.fillStyle = item.color || shape.color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = isSelected ? "#ff4444" : "rgba(255,255,255,0.3)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

      // Label
      const fontSize = Math.max(8, Math.min(14, scale * 0.6));
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shape.label, 0, 0);

      ctx.restore();
    }

    // Ghost preview
    if (selectedTool && mousePos) {
      const shape = ITEM_SHAPES[selectedTool] || { w: 1, h: 1, color: "#ff00ff", label: "?" };
      const [sx, sy] = worldToScreen(mousePos[0], mousePos[1]);
      const pw = shape.w * scale;
      const ph = shape.h * scale;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ghostRotation);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = shape.color;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      const fontSize = Math.max(8, Math.min(14, scale * 0.6));
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(shape.label, 0, 0);
      ctx.restore();
    }

    // Coordinate info
    if (mousePos) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`(${mousePos[0].toFixed(1)}, ${mousePos[1].toFixed(1)})`, 8, h - 8);
    }
  }, [items, theme, camX, camZ, zoom, selectedUid, selectedTool, mousePos, ghostRotation, worldToScreen]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastDrag.current[0];
      const dy = e.clientY - lastDrag.current[1];
      setCamX(p => p - dx / (CANVAS_CELL * zoom));
      setCamZ(p => p - dy / (CANVAS_CELL * zoom));
      lastDrag.current = [e.clientX, e.clientY];
    }
    const [wx, wz] = screenToWorld(e.clientX, e.clientY);
    setMousePos([wx, wz]);
  }, [screenToWorld, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      isDragging.current = true;
      lastDrag.current = [e.clientX, e.clientY];
      return;
    }
    if (e.button !== 0) return;

    const [wx, wz] = screenToWorld(e.clientX, e.clientY);

    if (selectedTool) {
      const newItem: PlacedItem = {
        uid: generateUid(),
        itemId: selectedTool,
        position: [wx, 0, wz],
        rotation: ghostRotation,
        scale: 1,
      };
      setItems(prev => [...prev, newItem]);
    } else {
      // Try to select an item
      let closest: string | null = null;
      let closestDist = 1.5;
      for (const item of items) {
        const dx = item.position[0] - wx;
        const dz = item.position[2] - wz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) {
          closestDist = dist;
          closest = item.uid;
        }
      }
      setSelectedUid(closest);
    }
  }, [selectedTool, ghostRotation, screenToWorld, items]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(4, prev + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  const handleSave = useCallback(() => {
    const level: CustomLevel = {
      id: editingLevelId || `level_${Date.now()}`,
      name: levelName,
      theme,
      items,
      bounds: { minX: -35, maxX: 35, minZ: -60, maxZ: 30 },
      createdAt: Date.now(),
    };
    saveCustomLevel(level);
    setEditingLevelId(level.id);
    setSavedLevels(loadCustomLevels());
  }, [items, theme, levelName, editingLevelId]);

  const handleLoad = useCallback((level: CustomLevel) => {
    setItems(level.items);
    setTheme(level.theme);
    setLevelName(level.name);
    setEditingLevelId(level.id);
    setShowLoadMenu(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteCustomLevel(id);
    setSavedLevels(loadCustomLevels());
    if (editingLevelId === id) {
      setEditingLevelId(null);
      setItems([]);
    }
  }, [editingLevelId]);

  const handleClear = useCallback(() => {
    setItems([]);
    setSelectedUid(null);
    setEditingLevelId(null);
  }, []);

  const filteredItems = EDITOR_CATALOG.filter(d => d.category === selectedCategory);
  const selectedItem = selectedUid ? items.find(i => i.uid === selectedUid) : null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black">
      {/* Left Panel */}
      <div className="w-72 bg-gray-950/95 border-r border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-black text-sm">🗺️ LEVEL EDITOR</h2>
            <button onClick={onExit} className="text-white/30 hover:text-white/60 text-xs px-2 py-1 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
              ✕ Exit
            </button>
          </div>
          <input
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-white/30"
            placeholder="Level name..."
          />
        </div>

        {/* Theme Selector */}
        <div className="p-3 border-b border-white/10">
          <p className="text-white/40 text-[9px] uppercase tracking-wider mb-2 font-bold">Theme</p>
          <div className="grid grid-cols-3 gap-1.5">
            {EDITOR_THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-2 rounded-lg text-center transition-all text-xs ${
                  theme === t.id
                    ? "bg-white/15 border border-white/30 text-white"
                    : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                <div className="text-lg">{t.emoji}</div>
                <div className="text-[8px] font-bold mt-0.5">{t.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-white/10">
          {(Object.keys(CAT_LABELS) as EditorCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedTool(null); }}
              className={`flex-1 py-2 text-center transition-all text-[9px] font-bold ${
                selectedCategory === cat
                  ? "bg-white/10 text-white border-b-2 border-white/40"
                  : "text-white/30 hover:text-white/50 hover:bg-white/5"
              }`}
            >
              <div className="text-sm">{CAT_LABELS[cat].emoji}</div>
              {CAT_LABELS[cat].name}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setSelectedTool(selectedTool === item.id ? null : item.id); setSelectedUid(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left ${
                selectedTool === item.id
                  ? "bg-white/15 border-white/30 text-white"
                  : `${CAT_COLORS[item.category]} text-white/70 border`
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-xs font-bold">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Selected item properties */}
        {selectedItem && (
          <div className="p-3 border-t border-white/10 space-y-2">
            <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold">Selected: {EDITOR_CATALOG.find(d => d.id === selectedItem.itemId)?.name}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setItems(prev => prev.map(i => i.uid === selectedUid ? { ...i, rotation: i.rotation + Math.PI / 4 } : i))}
                className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-[10px] font-bold hover:bg-white/10 transition-all"
              >🔄 Rotate</button>
              <button
                onClick={() => { setItems(prev => prev.filter(i => i.uid !== selectedUid)); setSelectedUid(null); }}
                className="flex-1 px-2 py-1.5 bg-red-950/50 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold hover:bg-red-900/50 transition-all"
              >🗑️ Delete</button>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <div className="flex gap-1.5">
            <button onClick={handleSave} className="flex-1 px-3 py-2 bg-green-950/50 border border-green-500/20 rounded-lg text-green-400 text-[10px] font-bold hover:bg-green-900/50 transition-all">
              💾 Save
            </button>
            <button onClick={() => { setSavedLevels(loadCustomLevels()); setShowLoadMenu(true); }} className="flex-1 px-3 py-2 bg-blue-950/50 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-bold hover:bg-blue-900/50 transition-all">
              📂 Load
            </button>
            <button onClick={handleClear} className="px-3 py-2 bg-red-950/50 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold hover:bg-red-900/50 transition-all">
              🗑️
            </button>
          </div>
          <div className="text-white/20 text-[8px] text-center">
            WASD: Pan • R: Rotate • Del: Remove • Click: Place/Select • Scroll: Zoom • MMB: Pan
          </div>
          <div className="text-white/15 text-[8px] text-center">
            {items.length} objects placed • Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* 2D Canvas */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair" onContextMenu={e => e.preventDefault()}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full"
        />

        {/* Tool indicator */}
        {selectedTool && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <span className="text-white text-xs font-bold">
              Placing: {EDITOR_CATALOG.find(d => d.id === selectedTool)?.emoji} {EDITOR_CATALOG.find(d => d.id === selectedTool)?.name}
              <span className="text-white/30 ml-2">Click to place • ESC to cancel</span>
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
          <p className="text-white/40 text-[9px] font-bold mb-1">TOP-DOWN VIEW</p>
          <p className="text-white/25 text-[8px]">Items shown from above</p>
          <p className="text-white/25 text-[8px]">Colors match in-game</p>
        </div>
      </div>

      {/* Load Menu Overlay */}
      {showLoadMenu && (
        <div className="absolute inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-950 border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black">📂 Saved Levels</h3>
              <button onClick={() => setShowLoadMenu(false)} className="text-white/30 hover:text-white/60 text-sm">✕</button>
            </div>
            {savedLevels.length === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">No saved levels yet</p>
            ) : (
              <div className="space-y-2">
                {savedLevels.map(level => (
                  <div key={level.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">{level.name}</div>
                      <div className="text-white/30 text-[10px]">
                        {EDITOR_THEMES.find(t => t.id === level.theme)?.emoji} {level.theme} • {level.items.length} objects • {new Date(level.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={() => handleLoad(level)} className="px-3 py-1.5 bg-blue-950/50 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] font-bold hover:bg-blue-900/50 transition-all">
                      Load
                    </button>
                    <button onClick={() => handleDelete(level.id)} className="px-2 py-1.5 bg-red-950/50 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold hover:bg-red-900/50 transition-all">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
