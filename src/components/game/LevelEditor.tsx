import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EditorCategory, EDITOR_CATALOG, EDITOR_THEMES, EditorTheme,
  PlacedItem, CustomLevel, saveCustomLevel, loadCustomLevels, deleteCustomLevel, generateUid,
} from "./LevelEditorData";

// ========== 3D Object Renderers ==========
function EditorObject({ item }: { item: PlacedItem }) {
  const def = EDITOR_CATALOG.find(d => d.id === item.itemId);
  if (!def) return null;
  const pos = item.position;
  const rot = item.rotation;
  const s = item.scale;

  switch (item.itemId) {
    case "wall_short":
    case "wall_tall":
    case "wall_L": {
      const size = def.defaultSize || [4, 2, 0.15];
      return (
        <mesh position={[pos[0], pos[1] + size[1] / 2, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={item.color || def.color || "#888"} roughness={0.7} />
        </mesh>
      );
    }
    case "container": {
      const c = item.color || "#cc4444";
      return (
        <group position={pos} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, 2.6, 6]} />
            <meshStandardMaterial color={c} roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 2.62, 0]}>
            <boxGeometry args={[3.1, 0.04, 6.1]} />
            <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      );
    }
    case "platform":
      return (
        <mesh position={[pos[0], pos[1] + 0.15, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <boxGeometry args={[4, 0.3, 4]} />
          <meshStandardMaterial color={item.color || "#666"} roughness={0.5} metalness={0.3} />
        </mesh>
      );
    case "ramp":
      return (
        <group position={pos} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 1, 0]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3, 0.2, 5]} />
            <meshStandardMaterial color={item.color || "#888"} roughness={0.6} />
          </mesh>
        </group>
      );
    case "crate":
      return (
        <mesh position={[pos[0], pos[1] + 0.4 * s, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#8B6914" roughness={0.85} />
        </mesh>
      );
    case "barrel":
      return (
        <group position={[pos[0], pos[1], pos[2]]} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 12]} />
            <meshStandardMaterial color="#5a4020" roughness={0.8} />
          </mesh>
        </group>
      );
    case "box":
      return (
        <mesh position={[pos[0], pos[1] + 0.25 * s, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
        </mesh>
      );
    case "sack":
      return (
        <mesh position={[pos[0], pos[1] + 0.35 * s, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color="#9a8a5a" roughness={0.95} flatShading />
        </mesh>
      );
    case "tire":
      return (
        <mesh position={[pos[0], pos[1] + 0.3 * s, pos[2]]} rotation={[Math.PI / 2, 0, rot]} scale={s} castShadow receiveShadow>
          <torusGeometry args={[0.3, 0.12, 8, 16]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      );
    case "icebox":
      return (
        <mesh position={[pos[0], pos[1] + 0.275 * s, pos[2]]} rotation={[0, rot, 0]} scale={s} castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.55, 0.65]} />
          <meshStandardMaterial color="#99bbdd" roughness={0.2} metalness={0.1} transparent opacity={0.8} />
        </mesh>
      );
    case "crate_stack":
      return (
        <group position={pos} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#8B6914" roughness={0.85} /></mesh>
          <mesh position={[0.8, 0.4, 0]} castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#8B6914" roughness={0.85} /></mesh>
          <mesh position={[0.4, 1.2, 0]} castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#8B6914" roughness={0.85} /></mesh>
        </group>
      );
    case "tree":
      return (
        <group position={pos} scale={s}>
          <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.15, 0.2, 3, 8]} /><meshStandardMaterial color="#5a3a1a" roughness={0.9} /></mesh>
          <mesh position={[0, 3.5, 0]} castShadow><coneGeometry args={[1.5, 3, 8]} /><meshStandardMaterial color="#1a5a1a" roughness={0.85} /></mesh>
          <mesh position={[0, 4.8, 0]} castShadow><coneGeometry args={[1.0, 2, 8]} /><meshStandardMaterial color="#1e6e1e" roughness={0.85} /></mesh>
        </group>
      );
    case "snow_tree":
      return (
        <group position={pos} scale={s}>
          <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.15, 0.2, 3, 8]} /><meshStandardMaterial color="#4a3020" roughness={0.9} /></mesh>
          <mesh position={[0, 3.5, 0]} castShadow><coneGeometry args={[1.5, 3, 8]} /><meshStandardMaterial color="#1a4a2a" roughness={0.85} /></mesh>
          <mesh position={[0, 5.9, 0]}><coneGeometry args={[0.6, 0.5, 8]} /><meshStandardMaterial color="#eeeeff" roughness={0.4} /></mesh>
        </group>
      );
    case "lamppost":
      return (
        <group position={pos} scale={s}>
          <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 4, 8]} /><meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[0, 4.2, 0]}><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#ffffcc" emissive="#ffeeaa" emissiveIntensity={2} /></mesh>
          <pointLight position={[pos[0], pos[1] + 4.2, pos[2]]} color="#ffeedd" intensity={3} distance={15} decay={2} />
        </group>
      );
    case "rock":
      return (
        <mesh position={[pos[0], pos[1] + 0.3 * s, pos[2]]} scale={s} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#666655" roughness={0.95} flatShading />
        </mesh>
      );
    case "ice_rock":
      return (
        <mesh position={[pos[0], pos[1] + 0.3 * s, pos[2]]} scale={s} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial color="#8899bb" roughness={0.2} metalness={0.1} transparent opacity={0.85} />
        </mesh>
      );
    case "campfire":
      return (
        <group position={pos} scale={s}>
          <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} /></mesh>
          <pointLight position={[pos[0], pos[1] + 0.5, pos[2]]} color="#ff6622" intensity={4} distance={12} decay={2} />
        </group>
      );
    case "tent":
      return (
        <group position={pos} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 1, 0]} castShadow><coneGeometry args={[1.8, 2, 4]} /><meshStandardMaterial color="#cc8844" roughness={0.9} side={THREE.DoubleSide} /></mesh>
        </group>
      );
    case "igloo":
      return (
        <group position={pos} scale={s}>
          <mesh position={[0, 1, 0]} castShadow><sphereGeometry args={[1.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#dde8f0" roughness={0.4} /></mesh>
        </group>
      );
    case "snowdrift":
      return (
        <mesh position={[pos[0], pos[1] + 0.2 * s, pos[2]]} scale={[s * 2, s * 0.5, s * 1.5]} castShadow receiveShadow>
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e0e8f0" roughness={0.3} />
        </mesh>
      );
    case "sofa":
      return (
        <group position={pos} rotation={[0, rot, 0]} scale={s}>
          <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[2, 0.5, 0.9]} /><meshStandardMaterial color="#8844aa" roughness={0.8} /></mesh>
          <mesh position={[0, 0.6, -0.35]} castShadow><boxGeometry args={[2, 0.5, 0.2]} /><meshStandardMaterial color="#8844aa" roughness={0.8} /></mesh>
        </group>
      );
    case "coin_spawn":
      return (
        <mesh position={[pos[0], pos[1] + 0.3, pos[2]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={1} metalness={0.8} roughness={0.2} />
        </mesh>
      );
    case "medkit_spawn":
      return (
        <group position={[pos[0], pos[1] + 0.2, pos[2]]}>
          <mesh castShadow><boxGeometry args={[0.4, 0.25, 0.3]} /><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
          <mesh position={[0, 0.13, 0]}><boxGeometry args={[0.15, 0.02, 0.15]} /><meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} /></mesh>
        </group>
      );
    case "ammo_spawn":
      return (
        <group position={[pos[0], pos[1] + 0.15, pos[2]]}>
          <mesh castShadow><boxGeometry args={[0.35, 0.2, 0.25]} /><meshStandardMaterial color="#556633" roughness={0.7} /></mesh>
          <mesh position={[0, 0.11, 0]}><boxGeometry args={[0.1, 0.02, 0.1]} /><meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={1} /></mesh>
        </group>
      );
    case "hatch":
      return (
        <group position={[pos[0], pos[1] + 0.02, pos[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[0.9, 16]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.3, 16]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.85, 0.95, 16]} />
            <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={pos} scale={s}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#ff00ff" />
        </mesh>
      );
  }
}

// ========== Editor Camera ==========
function EditorCamera({ camPos }: { camPos: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(camPos.current, 0.1);
    camera.lookAt(camPos.current.x, 0, camPos.current.z);
  });
  return null;
}

// ========== Grid ==========
function EditorGrid() {
  return (
    <gridHelper args={[80, 80, "#444", "#333"]} position={[0, 0.01, 0]} />
  );
}

// ========== Ghost Preview ==========
function GhostPreview({ itemId, position, rotation }: { itemId: string; position: [number, number, number]; rotation: number }) {
  return (
    <group>
      <EditorObject item={{ uid: "ghost", itemId, position, rotation, scale: 1 }} />
      <mesh position={[position[0], 0.05, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ========== 3D Scene ==========
function EditorScene({
  items, theme, ghostItem, ghostPos, ghostRotation, onPlaceItem, selectedUid, onSelectItem
}: {
  items: PlacedItem[];
  theme: EditorTheme;
  ghostItem: string | null;
  ghostPos: [number, number, number];
  ghostRotation: number;
  onPlaceItem: (pos: [number, number, number]) => void;
  selectedUid: string | null;
  onSelectItem: (uid: string | null) => void;
}) {
  const themeDef = EDITOR_THEMES.find(t => t.id === theme) || EDITOR_THEMES[0];
  const { scene } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const camPos = useRef(new THREE.Vector3(0, 25, 20));

  // Update fog and background
  useEffect(() => {
    scene.background = new THREE.Color(themeDef.skyColor);
    scene.fog = new THREE.FogExp2(themeDef.fogColor, themeDef.fogDensity);
  }, [scene, themeDef]);

  // Camera movement with WASD
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      // Don't capture if typing in input
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      keys.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const interval = setInterval(() => {
      const speed = 0.5;
      if (keys.has("KeyW") || keys.has("ArrowUp")) camPos.current.z -= speed;
      if (keys.has("KeyS") || keys.has("ArrowDown")) camPos.current.z += speed;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) camPos.current.x -= speed;
      if (keys.has("KeyD") || keys.has("ArrowRight")) camPos.current.x += speed;
    }, 16);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, []);

  const handlePointerDown = useCallback((e: THREE.Event & { point?: THREE.Vector3 }) => {
    if (!e.point) return;
    const snapped: [number, number, number] = [
      Math.round(e.point.x * 2) / 2,
      0,
      Math.round(e.point.z * 2) / 2,
    ];

    if (ghostItem) {
      onPlaceItem(snapped);
    } else {
      // Check if clicking near an existing item
      let closest: string | null = null;
      let closestDist = 1.5;
      for (const item of items) {
        const dx = item.position[0] - snapped[0];
        const dz = item.position[2] - snapped[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) {
          closestDist = dist;
          closest = item.uid;
        }
      }
      onSelectItem(closest);
    }
  }, [ghostItem, onPlaceItem, items, onSelectItem]);

  return (
    <>
      <EditorCamera camPos={camPos} />
      <ambientLight color={themeDef.ambientColor} intensity={themeDef.ambientIntensity} />
      <directionalLight position={[20, 30, 10]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      {/* Ground */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={handlePointerDown as any}
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={themeDef.groundColor} roughness={0.9} />
      </mesh>

      <EditorGrid />

      {/* Placed items */}
      {items.map(item => (
        <group key={item.uid}>
          <EditorObject item={item} />
          {selectedUid === item.uid && (
            <mesh position={[item.position[0], 0.06, item.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.8, 16]} />
              <meshBasicMaterial color="#ff4444" transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      ))}

      {/* Ghost preview */}
      {ghostItem && <GhostPreview itemId={ghostItem} position={ghostPos} rotation={ghostRotation} />}
    </>
  );
}

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

// ========== Main Editor Component ==========
export default function LevelEditor({ onExit }: { onExit: () => void }) {
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EditorCategory>("walls");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [theme, setTheme] = useState<EditorTheme>("grass");
  const [levelName, setLevelName] = useState("My Level");
  const [ghostPos, setGhostPos] = useState<[number, number, number]>([0, 0, 0]);
  const [ghostRotation, setGhostRotation] = useState(0);
  const [savedLevels, setSavedLevels] = useState(loadCustomLevels());
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUid]);

  // Mouse move for ghost position
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // We rely on the 3D scene's raycasting for actual placement
      // This is a rough estimate for the ghost
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handlePlaceItem = useCallback((pos: [number, number, number]) => {
    if (!selectedTool) return;
    const newItem: PlacedItem = {
      uid: generateUid(),
      itemId: selectedTool,
      position: pos,
      rotation: ghostRotation,
      scale: 1,
    };
    setItems(prev => [...prev, newItem]);
  }, [selectedTool, ghostRotation]);

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
            WASD: Pan • R: Rotate • Del: Remove • Click: Place/Select
          </div>
          <div className="text-white/15 text-[8px] text-center">
            {items.length} objects placed
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [0, 25, 20], fov: 50, near: 0.1, far: 200 }}
          gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
          dpr={[1, 1.5]}
        >
          <EditorScene
            items={items}
            theme={theme}
            ghostItem={selectedTool}
            ghostPos={ghostPos}
            ghostRotation={ghostRotation}
            onPlaceItem={handlePlaceItem}
            selectedUid={selectedUid}
            onSelectItem={setSelectedUid}
          />
        </Canvas>

        {/* Tool indicator */}
        {selectedTool && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
            <span className="text-white text-xs font-bold">
              Placing: {EDITOR_CATALOG.find(d => d.id === selectedTool)?.emoji} {EDITOR_CATALOG.find(d => d.id === selectedTool)?.name}
              <span className="text-white/30 ml-2">Click ground to place • ESC to cancel</span>
            </span>
          </div>
        )}
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
