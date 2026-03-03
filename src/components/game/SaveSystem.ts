export interface SaveData {
  coins: number;
  powerups: string[];
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
    return { coins: Math.max(0, Math.floor(parsed.coins)), powerups: parsed.powerups.filter((p: unknown) => typeof p === "string") };
  } catch {
    return null;
  }
}

const LS_KEY = "hideseek_save";

export function autoSave(data: SaveData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

export function autoLoad(): SaveData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.coins === "number" && Array.isArray(parsed.powerups)) {
      return { coins: Math.max(0, Math.floor(parsed.coins)), powerups: parsed.powerups };
    }
  } catch {}
  return null;
}
