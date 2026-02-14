import { createContext, useContext, useState, useCallback, useRef } from "react";

interface GameState {
  score: number;
  totalItems: number;
  collected: Set<string>;
  startTime: number | null;
  elapsedTime: number;
  gameWon: boolean;
  isPlaying: boolean;
  collect: (id: string) => void;
  startGame: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const TOTAL_ITEMS = 8;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(0);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    setScore(0);
    setCollected(new Set());
    setGameWon(false);
    setIsPlaying(true);
    const now = Date.now();
    setStartTime(now);
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Date.now() - now);
    }, 100);
  }, []);

  const collect = useCallback((id: string) => {
    setCollected(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      const newScore = next.size;
      setScore(newScore);
      if (newScore >= TOTAL_ITEMS) {
        setGameWon(true);
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return next;
    });
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setCollected(new Set());
    setGameWon(false);
    setIsPlaying(false);
    setStartTime(null);
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return (
    <GameContext.Provider value={{ score, totalItems: TOTAL_ITEMS, collected, startTime, elapsedTime, gameWon, isPlaying, collect, startGame, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}
