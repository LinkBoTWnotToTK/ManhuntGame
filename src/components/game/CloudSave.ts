// Cloud save/load system using Lovable Cloud (Supabase)
import { supabase } from "@/integrations/supabase/client";
import type { SaveData, LeaderboardEntry } from "./SaveSystem";
import type { CampaignProgress } from "./CampaignData";

function generateSaveCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const CLOUD_SAVE_CODE_KEY = "hideseek_cloud_code";

export function getCloudSaveCode(): string | null {
  return localStorage.getItem(CLOUD_SAVE_CODE_KEY);
}

export function setCloudSaveCode(code: string) {
  localStorage.setItem(CLOUD_SAVE_CODE_KEY, code);
}

export async function cloudSave(data: SaveData, campaign: CampaignProgress): Promise<string> {
  let code = getCloudSaveCode();
  
  const row = {
    coins: data.coins,
    powerups: data.powerups,
    level: data.level,
    xp: data.xp,
    prestige: data.prestige,
    total_wins: data.totalWins,
    total_games: data.totalGames,
    equipped_skin: data.equippedSkin,
    equipped_trail: data.equippedTrail,
    equipped_hat: data.equippedHat,
    campaign_completed: campaign.completed,
    campaign_best_times: campaign.bestTimes,
    campaign_stars: campaign.stars,
  };

  if (code) {
    const { error } = await supabase
      .from("game_saves")
      .update(row)
      .eq("save_code", code);
    if (!error) return code;
  }

  // Create new save
  code = generateSaveCode();
  const { error } = await supabase
    .from("game_saves")
    .insert({ ...row, save_code: code });
  
  if (!error) {
    setCloudSaveCode(code);
    return code;
  }
  
  throw new Error("Failed to save to cloud");
}

export async function cloudLoad(code: string): Promise<{ save: SaveData; campaign: CampaignProgress } | null> {
  const { data, error } = await supabase
    .from("game_saves")
    .select("*")
    .eq("save_code", code.trim().toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  setCloudSaveCode(code.trim().toUpperCase());

  return {
    save: {
      coins: data.coins,
      powerups: data.powerups || [],
      level: data.level,
      xp: data.xp,
      prestige: data.prestige,
      totalWins: data.total_wins,
      totalGames: data.total_games,
      equippedSkin: data.equipped_skin,
      equippedTrail: data.equipped_trail,
      equippedHat: data.equipped_hat,
    },
    campaign: {
      completed: data.campaign_completed || [],
      bestTimes: (data.campaign_best_times as Record<string, number>) || {},
      stars: (data.campaign_stars as Record<string, number>) || {},
    },
  };
}

export async function cloudSaveLeaderboard(entry: LeaderboardEntry) {
  const code = getCloudSaveCode();
  await supabase.from("game_leaderboard").insert({
    save_code: code,
    mode: entry.mode,
    role: entry.role,
    map: entry.map,
    difficulty: entry.difficulty,
    time_seconds: entry.time,
    result: entry.result,
    score: entry.score,
  });
}

export async function cloudLoadLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from("game_leaderboard")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data) return [];
  return data.map(d => ({
    mode: d.mode,
    role: d.role,
    map: d.map,
    difficulty: d.difficulty,
    time: Number(d.time_seconds),
    result: d.result as "win" | "lose",
    score: d.score,
    date: new Date(d.created_at).getTime(),
  }));
}
