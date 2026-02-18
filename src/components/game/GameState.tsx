import { createContext, useContext, useState, useCallback, useRef } from "react";
import { resetSharedState } from "./SharedState";

export type Role = "runner" | "hunter";
export type GameMap = "suburban" | "industrial" | "forest" | "arctic" | "underground";

export interface MapBounds {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

export const MAP_BOUNDS: Record<GameMap, MapBounds> = {
  suburban:     { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 29.5 },
  industrial:   { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  forest:       { minX: -44.5, maxX: 44.5, minZ: -69.5, maxZ: 34.5 },
  arctic:       { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  underground:  { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 24.5 },
};

export const ESCAPE_POSITIONS: Record<GameMap, [number, number, number]> = {
  suburban:     [0, 0, -54],
  industrial:   [0, 0, -59],
  forest:       [0, 0, -64],
  arctic:       [0, 0, -59],
  underground:  [0, 0, -54],
};

interface MedkitData {
  id: string;
  position: [number, number, number];
}

interface AmmoPickupData {
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
  useStamina: (amount: number) => boolean;
  regenStamina: (amount: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const GAME_DURATION = 60;
const MAX_STAMINA = 100;
const MAX_HEALTH = 3;
const RUNNER_START_AMMO = 3;
const HUNTER_START_AMMO = 0;

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
  const [playerHealth, setPlayerHealth] = useState(MAX_HEALTH);
  const [playerAmmo, setPlayerAmmo] = useState(0);
  const [npcHealth, setNpcHealth] = useState<Record<string, number>>({});
  const [medkits, setMedkits] = useState<MedkitData[]>([]);
  const [ammoPickups, setAmmoPickups] = useState<AmmoPickupData[]>([]);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const roleRef = useRef<Role | null>(null);
  const mapRef = useRef<GameMap | null>(null);
  const playerHealthRef = useRef(MAX_HEALTH);
  const playerAmmoRef = useRef(0);
  const npcHealthRef = useRef<Record<string, number>>({});
  const nextMedkitSpawn = useRef(30);
  const nextAmmoSpawn = useRef(10);

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
    const startAmmo = roleRef.current === "runner" ? RUNNER_START_AMMO : HUNTER_START_AMMO;
    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setEscapeOpen(false);
    setEscapedState(false);
    setStamina(MAX_STAMINA);
    setPlayerHealth(MAX_HEALTH);
    setPlayerAmmo(startAmmo);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    playerHealthRef.current = MAX_HEALTH;
    playerAmmoRef.current = startAmmo;
    npcHealthRef.current = {};
    nextMedkitSpawn.current = 30;
    nextAmmoSpawn.current = 10;
    gameOverRef.current = false;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (gameOverRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= GAME_DURATION) setEscapeOpen(true);

      const bounds = MAP_BOUNDS[mapRef.current || "suburban"];

      // Medkit spawn every 30s
      if (elapsed >= nextMedkitSpawn.current) {
        nextMedkitSpawn.current += 30;
        const x = bounds.minX + 5 + Math.random() * (bounds.maxX - bounds.minX - 10);
        const z = bounds.minZ + 5 + Math.random() * (bounds.maxZ - bounds.minZ - 10);
        setMedkits((prev) => [...prev.slice(-4), { id: `m${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      // Ammo spawn every 10s (only relevant for runners)
      if (roleRef.current === "runner" && elapsed >= nextAmmoSpawn.current) {
        nextAmmoSpawn.current += 10;
        const x = bounds.minX + 5 + Math.random() * (bounds.maxX - bounds.minX - 10);
        const z = bounds.minZ + 5 + Math.random() * (bounds.maxZ - bounds.minZ - 10);
        setAmmoPickups((prev) => [...prev.slice(-6), { id: `a${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      if (elapsed >= GAME_DURATION + 15) {
        gameOverRef.current = true;
        setGameOver(true);
        setGameResult("lose");
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);
  }, []);

  const totalNPCs = role === "hunter" ? 7 : 3;

  const tagNPC = useCallback((id: string) => {
    setTagged((prev) => {
      if (prev.has(id) || gameOverRef.current) return prev;
      const next = new Set(prev);
      next.add(id);

      const isHunter = roleRef.current === "hunter";
      const enemyTotal = isHunter ? 7 : 3;
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
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const damagePlayer = useCallback((amount: number) => {
    if (gameOverRef.current) return;
    playerHealthRef.current = Math.max(0, playerHealthRef.current - amount);
    setPlayerHealth(playerHealthRef.current);
    if (playerHealthRef.current <= 0) {
      gameOverRef.current = true;
      setGameOver(true);
      setGameResult("lose");
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const damageNPC = useCallback((id: string, amount: number) => {
    const current = npcHealthRef.current[id] ?? 3;
    npcHealthRef.current[id] = Math.max(0, current - amount);
    setNpcHealth({ ...npcHealthRef.current });
  }, []);

  const healPlayer = useCallback(() => {
    playerHealthRef.current = Math.min(MAX_HEALTH, playerHealthRef.current + 1);
    setPlayerHealth(playerHealthRef.current);
  }, []);

  const useAmmoFn = useCallback(() => {
    if (roleRef.current !== "runner") return false; // Only runners can shoot
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
    setPlayerHealth(MAX_HEALTH);
    setPlayerAmmo(0);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    playerHealthRef.current = MAX_HEALTH;
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
        selectRole, selectMap, tagNPC, startGame, resetGame, setEscaped,
        damagePlayer, damageNPC, healPlayer, useAmmo: useAmmoFn,
        collectMedkit, collectAmmo, useStamina: useStaminaFn, regenStamina,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
