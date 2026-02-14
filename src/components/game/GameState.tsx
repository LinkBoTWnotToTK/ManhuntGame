import { createContext, useContext, useState, useCallback, useRef } from "react";

export type Role = "runner" | "hunter";

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
  selectRole: (role: Role) => void;
  tagNPC: (id: string) => void;
  startGame: () => void;
  resetGame: () => void;
  setEscaped: () => void;
  setCaught: () => void;
  useStamina: (amount: number) => boolean;
  regenStamina: (amount: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const HUNTER_NPC_COUNT = 7;
const RUNNER_NPC_COUNT = 3;
const GAME_DURATION = 60; // 1 minute
const MAX_STAMINA = 100;

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
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);

  const selectRole = useCallback((r: Role) => {
    setRole(r);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setEscapeOpen(false);
    setEscapedState(false);
    setStamina(MAX_STAMINA);
    gameOverRef.current = false;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (gameOverRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= GAME_DURATION) {
        setEscapeOpen(true);
      }

      // Hunter loses when escape opens (runners got away)
      if (elapsed >= GAME_DURATION + 15) {
        gameOverRef.current = true;
        setGameOver(true);
        setGameResult("lose");
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);
  }, []);

  const totalNPCs = role === "hunter" ? HUNTER_NPC_COUNT : RUNNER_NPC_COUNT;

  const tagNPC = useCallback((id: string) => {
    setTagged(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      const newScore = next.size;
      setScore(newScore);

      if (newScore >= HUNTER_NPC_COUNT) {
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

  const setCaught = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    setGameResult("lose");
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const useStaminaFn = useCallback((amount: number) => {
    let canUse = false;
    setStamina(prev => {
      if (prev >= amount) {
        canUse = true;
        return prev - amount;
      }
      return prev;
    });
    return canUse;
  }, []);

  const regenStamina = useCallback((amount: number) => {
    setStamina(prev => Math.min(MAX_STAMINA, prev + amount));
  }, []);

  const resetGame = useCallback(() => {
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
    gameOverRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const timeLeft = Math.max(0, GAME_DURATION - elapsedTime);

  return (
    <GameContext.Provider value={{
      role, score, totalNPCs, tagged, elapsedTime, timeLeft,
      gameOver, gameResult, isPlaying, escapeOpen, escaped,
      stamina, maxStamina: MAX_STAMINA,
      selectRole, tagNPC, startGame, resetGame, setEscaped, setCaught,
      useStamina: useStaminaFn, regenStamina
    }}>
      {children}
    </GameContext.Provider>
  );
}
