import { createContext, useContext, useState, useCallback, useRef } from "react";
import { resetSharedState } from "./SharedState";

export type Role = "runner" | "hunter";

interface MedkitData {
  id: string;
  position: [number, number, number];
}

interface GameState {
  role: Role | null;
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
  selectRole: (role: Role) => void;
  tagNPC: (id: string) => void;
  startGame: () => void;
  resetGame: () => void;
  setEscaped: () => void;
  damagePlayer: (amount: number) => void;
  damageNPC: (id: string, amount: number) => void;
  healPlayer: () => void;
  useAmmo: () => boolean;
  collectMedkit: (id: string) => void;
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
const MAX_AMMO = 5;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
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
  const [playerAmmo, setPlayerAmmo] = useState(MAX_AMMO);
  const [npcHealth, setNpcHealth] = useState<Record<string, number>>({});
  const [medkits, setMedkits] = useState<MedkitData[]>([]);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const roleRef = useRef<Role | null>(null);
  const playerHealthRef = useRef(MAX_HEALTH);
  const playerAmmoRef = useRef(MAX_AMMO);
  const npcHealthRef = useRef<Record<string, number>>({});
  const nextMedkitSpawn = useRef(30);

  const selectRole = useCallback((r: Role) => {
    setRole(r);
    roleRef.current = r;
  }, []);

  const endGame = useCallback((result: "win" | "lose") => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    setGameResult(result);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startGame = useCallback(() => {
    resetSharedState();
    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setEscapeOpen(false);
    setEscapedState(false);
    setStamina(MAX_STAMINA);
    setPlayerHealth(MAX_HEALTH);
    setPlayerAmmo(MAX_AMMO);
    setNpcHealth({});
    setMedkits([]);
    playerHealthRef.current = MAX_HEALTH;
    playerAmmoRef.current = MAX_AMMO;
    npcHealthRef.current = {};
    nextMedkitSpawn.current = 30;
    gameOverRef.current = false;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (gameOverRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= GAME_DURATION) setEscapeOpen(true);

      // Spawn medkits every 30 seconds
      if (elapsed >= nextMedkitSpawn.current) {
        nextMedkitSpawn.current += 30;
        const x = -20 + Math.random() * 40;
        const z = -35 + Math.random() * 50;
        setMedkits((prev) => [...prev.slice(-4), { id: `m${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
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
    endGame("win");
  }, [endGame]);

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
    if (playerAmmoRef.current <= 0) return false;
    playerAmmoRef.current--;
    setPlayerAmmo(playerAmmoRef.current);
    return true;
  }, []);

  const collectMedkit = useCallback((id: string) => {
    setMedkits((prev) => prev.filter((m) => m.id !== id));
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
    setPlayerAmmo(MAX_AMMO);
    setNpcHealth({});
    setMedkits([]);
    playerHealthRef.current = MAX_HEALTH;
    playerAmmoRef.current = MAX_AMMO;
    npcHealthRef.current = {};
    gameOverRef.current = false;
    roleRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const timeLeft = Math.max(0, GAME_DURATION - elapsedTime);

  return (
    <GameContext.Provider
      value={{
        role, score, totalNPCs, tagged, elapsedTime, timeLeft,
        gameOver, gameResult, isPlaying, escapeOpen, escaped,
        stamina, maxStamina: MAX_STAMINA,
        playerHealth, playerAmmo, npcHealth, medkits,
        selectRole, tagNPC, startGame, resetGame, setEscaped,
        damagePlayer, damageNPC, healPlayer, useAmmo: useAmmoFn,
        collectMedkit, useStamina: useStaminaFn, regenStamina,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
