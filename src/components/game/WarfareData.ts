// Giant Warfare Mode - TABS-style unit placement + Clash Royale tower capture

export interface WarfareUnitType {
  id: string;
  name: string;
  emoji: string;
  cost: number; // elixir/resource cost
  health: number;
  damage: number;
  speed: number; // movement speed
  range: number; // attack range
  attackCooldown: number; // seconds between attacks
  description: string;
  color: string;
  size: number; // visual scale
}

export interface WarfareTower {
  id: string;
  position: [number, number, number];
  team: "player" | "enemy" | "neutral";
  health: number;
  maxHealth: number;
  type: "king" | "princess"; // king = main tower, princess = side towers
}

export interface WarfareUnit {
  id: string;
  typeId: string;
  position: [number, number, number];
  team: "player" | "enemy";
  health: number;
  maxHealth: number;
  targetId: string | null;
  lastAttack: number;
  alive: boolean;
}

export const WARFARE_UNITS: WarfareUnitType[] = [
  {
    id: "knight",
    name: "Knight",
    emoji: "⚔️",
    cost: 3,
    health: 80,
    damage: 12,
    speed: 3.0,
    range: 1.5,
    attackCooldown: 1.2,
    description: "Sturdy melee fighter",
    color: "#4488cc",
    size: 1.0,
  },
  {
    id: "archer",
    name: "Archer",
    emoji: "🏹",
    cost: 3,
    health: 40,
    damage: 8,
    speed: 2.5,
    range: 8,
    attackCooldown: 1.0,
    description: "Ranged attacker, fragile",
    color: "#44cc44",
    size: 0.9,
  },
  {
    id: "giant",
    name: "Giant",
    emoji: "🗿",
    cost: 5,
    health: 200,
    damage: 20,
    speed: 1.5,
    range: 2,
    attackCooldown: 2.0,
    description: "Massive tank, targets towers",
    color: "#cc8844",
    size: 1.6,
  },
  {
    id: "wizard",
    name: "Wizard",
    emoji: "🧙",
    cost: 5,
    health: 50,
    damage: 25,
    speed: 2.0,
    range: 6,
    attackCooldown: 1.8,
    description: "Splash damage caster",
    color: "#aa44cc",
    size: 1.0,
  },
  {
    id: "barbarian",
    name: "Barbarian",
    emoji: "🪓",
    cost: 2,
    health: 50,
    damage: 10,
    speed: 4.0,
    range: 1.2,
    attackCooldown: 0.8,
    description: "Fast, cheap melee rusher",
    color: "#cc6622",
    size: 0.9,
  },
  {
    id: "healer",
    name: "Healer",
    emoji: "💚",
    cost: 4,
    health: 60,
    damage: 0,
    speed: 2.0,
    range: 5,
    attackCooldown: 2.0,
    description: "Heals nearby allies",
    color: "#22cc88",
    size: 0.9,
  },
  {
    id: "bomber",
    name: "Bomber",
    emoji: "💣",
    cost: 4,
    health: 35,
    damage: 30,
    speed: 2.5,
    range: 5,
    attackCooldown: 2.5,
    description: "High splash, very fragile",
    color: "#cc2244",
    size: 0.85,
  },
  {
    id: "golem",
    name: "Golem",
    emoji: "🏔️",
    cost: 8,
    health: 400,
    damage: 15,
    speed: 1.0,
    range: 1.5,
    attackCooldown: 2.5,
    description: "Ultimate tank, very slow",
    color: "#666688",
    size: 2.0,
  },
];

// Tower layout for the battlefield
// Player side is +Z (south), Enemy side is -Z (north)
export const WARFARE_TOWERS: Omit<WarfareTower, "health">[] = [
  // Player towers
  { id: "p_king", position: [0, 0, 25], team: "player", maxHealth: 500, type: "king" },
  { id: "p_left", position: [-12, 0, 18], team: "player", maxHealth: 250, type: "princess" },
  { id: "p_right", position: [12, 0, 18], team: "player", maxHealth: 250, type: "princess" },
  // Enemy towers
  { id: "e_king", position: [0, 0, -50], team: "enemy", maxHealth: 500, type: "king" },
  { id: "e_left", position: [-12, 0, -43], team: "enemy", maxHealth: 250, type: "princess" },
  { id: "e_right", position: [12, 0, -43], team: "enemy", maxHealth: 250, type: "princess" },
];

// Underground stockpile positions — hatches that lead to resource caches
export const WARFARE_STOCKPILES: { position: [number, number, number]; resource: "elixir" | "gold"; amount: number }[] = [
  { position: [-20, 0, 0], resource: "elixir", amount: 3 },
  { position: [20, 0, 0], resource: "elixir", amount: 3 },
  { position: [0, 0, -12], resource: "gold", amount: 5 },
  { position: [-15, 0, -25], resource: "elixir", amount: 2 },
  { position: [15, 0, -25], resource: "elixir", amount: 2 },
];

export const WARFARE_MAP_BOUNDS = { minX: -30, maxX: 30, minZ: -55, maxZ: 30 };

export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_RATE = 0.4; // per second
export const WARFARE_DURATION = 300; // 5 minutes default, can be 10
