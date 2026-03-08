import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { resetSharedState } from "./SharedState";
import { POWERUPS } from "./ShopData";
import { autoSave, autoLoad, SaveData } from "./SaveSystem";
import type { WeaponType } from "./WeaponSystem";
import { WEAPONS } from "./WeaponSystem";

export type Role = "runner" | "hunter";
export type GameMap = "suburban" | "industrial" | "forest" | "arctic" | "underground" | "volcano" | "space_station";

export interface MapBounds {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

export const MAP_BOUNDS: Record<GameMap, MapBounds> = {
  suburban:       { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 29.5 },
  industrial:     { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  forest:         { minX: -44.5, maxX: 44.5, minZ: -69.5, maxZ: 34.5 },
  arctic:         { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  underground:    { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 24.5 },
  volcano:        { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  space_station:  { minX: -34.5, maxX: 34.5, minZ: -54.5, maxZ: 24.5 },
};

export const ESCAPE_POSITIONS: Record<GameMap, [number, number, number]> = {
  suburban:       [0, 0, -54],
  industrial:     [0, 0, -59],
  forest:         [0, 0, -64],
  arctic:         [0, 0, -59],
  underground:    [0, 0, -54],
  volcano:        [0, 0, -59],
  space_station:  [0, 0, -49],
};

interface MedkitData {
  id: string;
  position: [number, number, number];
}

interface AmmoPickupData {
  id: string;
  position: [number, number, number];
}

interface CoinData {
  id: string;
  position: [number, number, number];
}

interface GameState {
  role: Role | null;
  selectedMap: GameMap | null;
  score: number;
  totalNPCs: number;
  tagged: Set<string>;
  elapsedTime: number;
  timeLeft: number;
  gameOver: boolean;
  gameResult: "win" | "lose" | null;
  isPlaying: boolean;
  escapeOpen: boolean;
  escaped: boolean;
  stamina: number;
  maxStamina: number;
  playerHealth: number;
  playerAmmo: number;
  npcHealth: Record<string, number>;
  medkits: MedkitData[];
  ammoPickups: AmmoPickupData[];
  coins: number;
  matchCoins: number;
  coinPickups: CoinData[];
  ownedPowerups: string[];
  speedMultiplier: number;
  staminaDrainMultiplier: number;
  maxHealth: number;
  currentWeapon: WeaponType;
  meleeCooldown: number;
  selectRole: (role: Role) => void;
  selectMap: (map: GameMap) => void;
  tagNPC: (id: string) => void;
  startGame: () => void;
  resetGame: () => void;
  setEscaped: () => void;
  damagePlayer: (amount: number) => void;
  damageNPC: (id: string, amount: number) => void;
  healPlayer: () => void;
  useAmmo: () => boolean;
  collectMedkit: (id: string) => void;
  collectAmmo: (id: string) => void;
  collectCoin: (id: string) => void;
  useStamina: (amount: number) => boolean;
  regenStamina: (amount: number) => void;
  buyPowerup: (id: string) => boolean;
  loadSaveData: (data: SaveData) => void;
  switchWeapon: (w: WeaponType) => void;
  setMeleeCooldown: (cd: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const GAME_DURATION = 60;
const MAX_STAMINA = 100;
const BASE_MAX_HEALTH = 3;
const RUNNER_START_AMMO = 3;
const HUNTER_START_AMMO = 0;

function spawnCoins(bounds: MapBounds, count: number): CoinData[] {
  const coins: CoinData[] = [];
  for (let i = 0; i < count; i++) {
    const x = bounds.minX + 5 + Math.random() * (bounds.maxX - bounds.minX - 10);
    const z = bounds.minZ + 5 + Math.random() * (bounds.maxZ - bounds.minZ - 10);
    coins.push({ id: `coin${i}_${Date.now()}`, position: [x, 0.3, z] });
  }
  return coins;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);
  const [score, setScore] = useState(0);
  const [tagged, setTagged] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [escaped, setEscapedState] = useState(false);
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [playerHealth, setPlayerHealth] = useState(BASE_MAX_HEALTH);
  const [playerAmmo, setPlayerAmmo] = useState(0);
  const [npcHealth, setNpcHealth] = useState<Record<string, number>>({});
  const [medkits, setMedkits] = useState<MedkitData[]>([]);
  const [ammoPickups, setAmmoPickups] = useState<AmmoPickupData[]>([]);
  const [coinPickups, setCoinPickups] = useState<CoinData[]>([]);
  const [coins, setCoins] = useState(0);
  const [matchCoins, setMatchCoins] = useState(0);
  const [ownedPowerups, setOwnedPowerups] = useState<string[]>([]);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("slingshot");
  const [meleeCooldown, setMeleeCooldownState] = useState(0);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const roleRef = useRef<Role | null>(null);
  const mapRef = useRef<GameMap | null>(null);
  const playerHealthRef = useRef(BASE_MAX_HEALTH);
  const playerAmmoRef = useRef(0);
  const npcHealthRef = useRef<Record<string, number>>({});
  const nextMedkitSpawn = useRef(30);
  const nextAmmoSpawn = useRef(10);
  const secondWindUsed = useRef(false);
  const ownedRef = useRef<string[]>([]);

  useEffect(() => {
    const saved = autoLoad();
    if (saved) {
      setCoins(saved.coins);
      setOwnedPowerups(saved.powerups);
      ownedRef.current = saved.powerups;
    }
  }, []);

  useEffect(() => {
    autoSave({ coins, powerups: ownedPowerups });
    ownedRef.current = ownedPowerups;
  }, [coins, ownedPowerups]);

  const hasP = (id: string) => ownedPowerups.includes(id);
  const speedMultiplier = hasP("iron_boots") ? 1.2 : 1.0;
  const staminaDrainMultiplier = hasP("ghost_step") ? 0.5 : 1.0;
  const maxHealth = hasP("extra_heart") ? 4 : BASE_MAX_HEALTH;
  const ammoSpawnInterval = hasP("quick_reload") ? 6 : 10;

  const selectRole = useCallback((r: Role) => {
    setRole(r);
    roleRef.current = r;
  }, []);

  const selectMap = useCallback((m: GameMap) => {
    setSelectedMap(m);
    mapRef.current = m;
  }, []);

  const startGame = useCallback(() => {
    resetSharedState();
    const owned = ownedRef.current;
    const extraAmmo = owned.includes("lucky_start") ? 2 : 0;
    const currentMaxHealth = owned.includes("extra_heart") ? 4 : BASE_MAX_HEALTH;
    const startAmmo = roleRef.current === "runner" ? RUNNER_START_AMMO + extraAmmo : HUNTER_START_AMMO;
    const ammoInterval = owned.includes("quick_reload") ? 6 : 10;

    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setEscapeOpen(false);
    setEscapedState(false);
    setStamina(MAX_STAMINA);
    setPlayerHealth(currentMaxHealth);
    setPlayerAmmo(startAmmo);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    setMatchCoins(0);
    playerHealthRef.current = currentMaxHealth;
    playerAmmoRef.current = startAmmo;
    npcHealthRef.current = {};
    nextMedkitSpawn.current = 30;
    nextAmmoSpawn.current = ammoInterval;
    gameOverRef.current = false;
    secondWindUsed.current = false;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    const bounds = MAP_BOUNDS[mapRef.current || "suburban"];
    setCoinPickups(spawnCoins(bounds, 18));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (gameOverRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= GAME_DURATION) setEscapeOpen(true);

      const b = MAP_BOUNDS[mapRef.current || "suburban"];

      if (elapsed >= nextMedkitSpawn.current) {
        nextMedkitSpawn.current += 30;
        const x = b.minX + 5 + Math.random() * (b.maxX - b.minX - 10);
        const z = b.minZ + 5 + Math.random() * (b.maxZ - b.minZ - 10);
        setMedkits((prev) => [...prev.slice(-4), { id: `m${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      if (roleRef.current === "runner" && elapsed >= nextAmmoSpawn.current) {
        nextAmmoSpawn.current += ammoInterval;
        const x = b.minX + 5 + Math.random() * (b.maxX - b.minX - 10);
        const z = b.minZ + 5 + Math.random() * (b.maxZ - b.minZ - 10);
        setAmmoPickups((prev) => [...prev.slice(-6), { id: `a${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      if (elapsed >= GAME_DURATION + 15) {
        gameOverRef.current = true;
        setGameOver(true);
        setGameResult("lose");
        setIsPlaying(false);
        setCoins((prev) => prev + 2);
        setMatchCoins((prev) => prev);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);
  }, []);

  const totalNPCs = role === "hunter" ? 7 : 5;

  const tagNPC = useCallback((id: string) => {
    setTagged((prev) => {
      if (prev.has(id) || gameOverRef.current) return prev;
      const next = new Set(prev);
      next.add(id);

      const isHunter = roleRef.current === "hunter";
      const enemyTotal = isHunter ? 7 : 5;
      let enemyCount = 0;
      for (const tid of next) {
        if (isHunter && tid.startsWith("r")) enemyCount++;
        if (!isHunter && tid.startsWith("h") && !tid.startsWith("ah")) enemyCount++;
      }
      setScore(enemyCount);

      if (enemyCount >= enemyTotal) {
        gameOverRef.current = true;
        setGameOver(true);
        setGameResult("win");
        setIsPlaying(false);
        setCoins((prev) => prev + 5);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return next;
    });
  }, []);

  const setEscaped = useCallback(() => {
    setEscapedState(true);
    gameOverRef.current = true;
    setGameOver(true);
    setGameResult("win");
    setIsPlaying(false);
    setCoins((prev) => prev + 5);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const damagePlayer = useCallback((amount: number) => {
    if (gameOverRef.current) return;
    const dmg = ownedRef.current.includes("thick_skin") ? Math.max(1, Math.ceil(amount / 2)) : amount;
    playerHealthRef.current = Math.max(0, playerHealthRef.current - dmg);
    setPlayerHealth(playerHealthRef.current);
    if (playerHealthRef.current <= 0) {
      if (ownedRef.current.includes("second_wind") && !secondWindUsed.current) {
        secondWindUsed.current = true;
        playerHealthRef.current = 1;
        setPlayerHealth(1);
        return;
      }
      gameOverRef.current = true;
      setGameOver(true);
      setGameResult("lose");
      setIsPlaying(false);
      setCoins((prev) => prev + 2);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const damageNPC = useCallback((id: string, amount: number) => {
    const current = npcHealthRef.current[id] ?? 3;
    npcHealthRef.current[id] = Math.max(0, current - amount);
    setNpcHealth({ ...npcHealthRef.current });
  }, []);

  const healPlayer = useCallback(() => {
    const mh = ownedRef.current.includes("extra_heart") ? 4 : BASE_MAX_HEALTH;
    playerHealthRef.current = Math.min(mh, playerHealthRef.current + 1);
    setPlayerHealth(playerHealthRef.current);
  }, []);

  const useAmmoFn = useCallback(() => {
    if (roleRef.current !== "runner") return false;
    if (playerAmmoRef.current <= 0) return false;
    playerAmmoRef.current--;
    setPlayerAmmo(playerAmmoRef.current);
    return true;
  }, []);

  const collectMedkit = useCallback((id: string) => {
    setMedkits((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const collectAmmo = useCallback((id: string) => {
    setAmmoPickups((prev) => prev.filter((a) => a.id !== id));
    playerAmmoRef.current += 2;
    setPlayerAmmo(playerAmmoRef.current);
  }, []);

  const collectCoin = useCallback((id: string) => {
    setCoinPickups((prev) => prev.filter((c) => c.id !== id));
    setCoins((prev) => prev + 1);
    setMatchCoins((prev) => prev + 1);
  }, []);

  const useStaminaFn = useCallback((amount: number) => {
    let canUse = false;
    setStamina((prev) => {
      if (prev >= amount) { canUse = true; return prev - amount; }
      return prev;
    });
    return canUse;
  }, []);

  const regenStamina = useCallback((amount: number) => {
    setStamina((prev) => Math.min(MAX_STAMINA, prev + amount));
  }, []);

  const buyPowerup = useCallback((id: string): boolean => {
    const def = POWERUPS.find((p) => p.id === id);
    if (!def) return false;
    let success = false;
    setOwnedPowerups((prev) => {
      if (prev.includes(id)) return prev;
      setCoins((prevCoins) => {
        if (prevCoins >= def.cost) {
          success = true;
          return prevCoins - def.cost;
        }
        return prevCoins;
      });
      if (success) return [...prev, id];
      return prev;
    });
    return success;
  }, []);

  const loadSaveData = useCallback((data: SaveData) => {
    setCoins(data.coins);
    setOwnedPowerups(data.powerups);
  }, []);

  const resetGame = useCallback(() => {
    resetSharedState();
    setRole(null);
    setSelectedMap(null);
    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(false);
    setEscapeOpen(false);
    setEscapedState(false);
    setElapsedTime(0);
    setStamina(MAX_STAMINA);
    setPlayerHealth(BASE_MAX_HEALTH);
    setPlayerAmmo(0);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    setCoinPickups([]);
    setMatchCoins(0);
    playerHealthRef.current = BASE_MAX_HEALTH;
    playerAmmoRef.current = 0;
    npcHealthRef.current = {};
    gameOverRef.current = false;
    roleRef.current = null;
    mapRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const timeLeft = Math.max(0, GAME_DURATION - elapsedTime);

  return (
    <GameContext.Provider
      value={{
        role, selectedMap, score, totalNPCs, tagged, elapsedTime, timeLeft,
        gameOver, gameResult, isPlaying, escapeOpen, escaped,
        stamina, maxStamina: MAX_STAMINA,
        playerHealth, playerAmmo, npcHealth, medkits, ammoPickups,
        coins, matchCoins, coinPickups, ownedPowerups,
        speedMultiplier, staminaDrainMultiplier, maxHealth,
        selectRole, selectMap, tagNPC, startGame, resetGame, setEscaped,
        damagePlayer, damageNPC, healPlayer, useAmmo: useAmmoFn,
        collectMedkit, collectAmmo, collectCoin,
        useStamina: useStaminaFn, regenStamina,
        buyPowerup, loadSaveData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
