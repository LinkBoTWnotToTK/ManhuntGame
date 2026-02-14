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
  selectRole: (role: Role) => void;
  tagNPC: (id: string) => void;
  startGame: () => void;
  resetGame: () => void;
  setEscaped: () => void;
  setCaught: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const TOTAL_NPCS = 5;
const GAME_DURATION = 120; // 2 minutes in seconds

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
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= GAME_DURATION) {
        setEscapeOpen(true);
      }

      // Hunter loses if time runs out + 30s grace after escape opens
      if (elapsed >= GAME_DURATION + 30) {
        // Game ends
      }
    }, 100);
  }, []);

  const tagNPC = useCallback((id: string) => {
    setTagged(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      const newScore = next.size;
      setScore(newScore);

      // Hunter wins by tagging all
      if (newScore >= TOTAL_NPCS) {
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
    setGameOver(true);
    setGameResult("win");
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const setCaught = useCallback(() => {
    setGameOver(true);
    setGameResult("lose");
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
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
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const timeLeft = Math.max(0, GAME_DURATION - elapsedTime);

  return (
    <GameContext.Provider value={{
      role, score, totalNPCs: TOTAL_NPCS, tagged, elapsedTime, timeLeft,
      gameOver, gameResult, isPlaying, escapeOpen, escaped,
      selectRole, tagNPC, startGame, resetGame, setEscaped, setCaught
    }}>
      {children}
    </GameContext.Provider>
  );
}
