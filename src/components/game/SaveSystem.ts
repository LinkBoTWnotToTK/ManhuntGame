export interface SaveData {
  coins: number;
  powerups: string[];
  level: number;
  xp: number;
  prestige: number;
  totalWins: number;
  totalGames: number;
}

export interface LeaderboardEntry {
  mode: string;
  role: string;
  map: string;
  difficulty: string;
  time: number;
  result: "win" | "lose";
  score: number;
  date: number;
}

function checksum(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum % 10000;
}

export function encodeSave(data: SaveData): string {
  const json = JSON.stringify(data);
  const cs = checksum(json);
  return btoa(json + "|" + cs);
}

export function decodeSave(code: string): SaveData | null {
  try {
    const raw = atob(code.trim());
    const pipeIdx = raw.lastIndexOf("|");
    if (pipeIdx === -1) return null;
    const json = raw.substring(0, pipeIdx);
    const cs = parseInt(raw.substring(pipeIdx + 1), 10);
    if (checksum(json) !== cs) return null;
    const parsed = JSON.parse(json);
    if (typeof parsed.coins !== "number" || !Array.isArray(parsed.powerups)) return null;
    return {
      coins: Math.max(0, Math.floor(parsed.coins)),
      powerups: parsed.powerups.filter((p: unknown) => typeof p === "string"),
      level: parsed.level ?? 1,
      xp: parsed.xp ?? 0,
      prestige: parsed.prestige ?? 0,
      totalWins: parsed.totalWins ?? 0,
      totalGames: parsed.totalGames ?? 0,
    };
  } catch {
    return null;
  }
}

const LS_KEY = "hideseek_save";
const LB_KEY = "hideseek_leaderboard";

export function autoSave(data: SaveData) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function autoLoad(): SaveData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.coins === "number" && Array.isArray(parsed.powerups)) {
      return {
        coins: Math.max(0, Math.floor(parsed.coins)),
        powerups: parsed.powerups,
        level: parsed.level ?? 1,
        xp: parsed.xp ?? 0,
        prestige: parsed.prestige ?? 0,
        totalWins: parsed.totalWins ?? 0,
        totalGames: parsed.totalGames ?? 0,
      };
    }
  } catch {}
  return null;
}

export function saveLeaderboard(entries: LeaderboardEntry[]) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(entries.slice(0, 50))); } catch {}
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

// XP required for each level
export function xpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.3, level - 1));
}

// Coin multiplier from prestige
export function prestigeMultiplier(prestige: number): number {
  return 1 + prestige * 0.25;
}
