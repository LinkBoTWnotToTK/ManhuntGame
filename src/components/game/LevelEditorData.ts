// Level Editor data types, catalog, and persistence

export type EditorCategory = "walls" | "objects" | "decor" | "items" | "hatches";

export interface EditorItemDef {
  id: string;
  name: string;
  emoji: string;
  category: EditorCategory;
  // Default size for walls
  defaultSize?: [number, number, number];
  color?: string;
}

export const EDITOR_CATALOG: EditorItemDef[] = [
  // Walls
  { id: "wall_short", name: "Short Wall", emoji: "🧱", category: "walls", defaultSize: [4, 2, 0.15], color: "#888" },
  { id: "wall_tall", name: "Tall Wall", emoji: "🏗️", category: "walls", defaultSize: [4, 4, 0.15], color: "#777" },
  { id: "wall_L", name: "L-Wall", emoji: "📐", category: "walls", defaultSize: [3, 2, 0.15], color: "#999" },
  { id: "container", name: "Container", emoji: "📦", category: "walls", defaultSize: [3, 2.6, 6], color: "#cc4444" },
  { id: "platform", name: "Platform", emoji: "⬜", category: "walls", defaultSize: [4, 0.3, 4], color: "#666" },
  { id: "ramp", name: "Ramp", emoji: "📈", category: "walls", defaultSize: [3, 2, 5], color: "#888" },

  // Objects
  { id: "crate", name: "Crate", emoji: "📦", category: "objects" },
  { id: "barrel", name: "Barrel", emoji: "🛢️", category: "objects" },
  { id: "box", name: "Box", emoji: "📥", category: "objects" },
  { id: "sack", name: "Sack", emoji: "💰", category: "objects" },
  { id: "tire", name: "Tire", emoji: "⭕", category: "objects" },
  { id: "icebox", name: "Ice Box", emoji: "🧊", category: "objects" },
  { id: "crate_stack", name: "Crate Stack", emoji: "🗄️", category: "objects" },

  // Decor
  { id: "tree", name: "Tree", emoji: "🌲", category: "decor" },
  { id: "snow_tree", name: "Snow Tree", emoji: "🎄", category: "decor" },
  { id: "lamppost", name: "Lamppost", emoji: "🔦", category: "decor" },
  { id: "rock", name: "Rock", emoji: "🪨", category: "decor" },
  { id: "ice_rock", name: "Ice Rock", emoji: "💎", category: "decor" },
  { id: "campfire", name: "Campfire", emoji: "🔥", category: "decor" },
  { id: "tent", name: "Tent", emoji: "⛺", category: "decor" },
  { id: "igloo", name: "Igloo", emoji: "🏠", category: "decor" },
  { id: "snowdrift", name: "Snowdrift", emoji: "❄️", category: "decor" },
  { id: "sofa", name: "Sofa", emoji: "🛋️", category: "decor" },

  // Items
  { id: "coin_spawn", name: "Coin Spawn", emoji: "🪙", category: "items" },
  { id: "medkit_spawn", name: "Medkit Spawn", emoji: "❤️‍🩹", category: "items" },
  { id: "ammo_spawn", name: "Ammo Spawn", emoji: "🎯", category: "items" },

  // Hatches
  { id: "hatch", name: "Hatch", emoji: "🕳️", category: "hatches" },
];

export interface PlacedItem {
  uid: string;
  itemId: string;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians
  scale: number;
  color?: string; // override color for walls/containers
}

export type EditorTheme = "grass" | "snow" | "sand" | "lava" | "metal" | "space";

export interface EditorThemeDef {
  id: EditorTheme;
  name: string;
  emoji: string;
  groundColor: string;
  skyColor: string;
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogDensity: number;
}

export const EDITOR_THEMES: EditorThemeDef[] = [
  { id: "grass", name: "Grass", emoji: "🌿", groundColor: "#2a5a1a", skyColor: "#87CEEB", ambientColor: "#c8d8e8", ambientIntensity: 0.6, fogColor: "#aabbcc", fogDensity: 0.008 },
  { id: "snow", name: "Snow", emoji: "❄️", groundColor: "#d8e4ec", skyColor: "#b0c4d8", ambientColor: "#d0dce8", ambientIntensity: 0.8, fogColor: "#ccdae8", fogDensity: 0.012 },
  { id: "sand", name: "Desert", emoji: "🏜️", groundColor: "#c4a854", skyColor: "#e8c870", ambientColor: "#f0d888", ambientIntensity: 0.7, fogColor: "#d8c080", fogDensity: 0.005 },
  { id: "lava", name: "Lava", emoji: "🌋", groundColor: "#2a1a0a", skyColor: "#1a0a00", ambientColor: "#ff6630", ambientIntensity: 0.4, fogColor: "#220800", fogDensity: 0.015 },
  { id: "metal", name: "Industrial", emoji: "🏭", groundColor: "#3a3a3a", skyColor: "#445566", ambientColor: "#889aaa", ambientIntensity: 0.5, fogColor: "#556677", fogDensity: 0.01 },
  { id: "space", name: "Space", emoji: "🚀", groundColor: "#111122", skyColor: "#000011", ambientColor: "#4466aa", ambientIntensity: 0.3, fogColor: "#000022", fogDensity: 0.005 },
];

export interface CustomLevel {
  id: string;
  name: string;
  theme: EditorTheme;
  items: PlacedItem[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  createdAt: number;
}

const STORAGE_KEY = "hide_seek_custom_levels";

export function saveCustomLevel(level: CustomLevel) {
  const levels = loadCustomLevels();
  const idx = levels.findIndex(l => l.id === level.id);
  if (idx >= 0) levels[idx] = level;
  else levels.push(level);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

export function loadCustomLevels(): CustomLevel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function deleteCustomLevel(id: string) {
  const levels = loadCustomLevels().filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

let uidCounter = 0;
export function generateUid(): string {
  return `item_${Date.now()}_${uidCounter++}`;
}
