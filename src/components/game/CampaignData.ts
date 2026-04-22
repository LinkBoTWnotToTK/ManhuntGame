// Campaign system with challenge levels, bosses, and star ratings

import type { GameMap, Difficulty } from "./GameState";

// Campaign uses its own mode type to reference the 4 remaining modes
type CampaignMode = "classic" | "infection" | "ctf" | "survival";

export interface BossData {
  name: string;
  emoji: string;
  healthMult: number;
  speedMult: number;
  size: number;
  color: string;
}

// Defines what triggers a WIN for a campaign challenge.
// This OVERRIDES the default mode win condition while a challenge is active.
//   surviveTime  – win once you survive `target` seconds (runner)
//   tagCount     – win once you tag `target` enemies (hunter)
//   surviveWaves – win once you complete `target` survival waves
//   escape       – win by reaching the escape portal (default classic/infection)
//   captureFlag  – win by returning the flag to base (default CTF)
//   defeatBoss   – win by killing the boss NPC
export type ChallengeType =
  | "surviveTime"
  | "tagCount"
  | "surviveWaves"
  | "escape"
  | "captureFlag"
  | "defeatBoss";

export interface CampaignChallenge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  map: GameMap;
  mode: CampaignMode;
  difficulty: Difficulty;
  role: "runner" | "hunter";
  objectives: string[];
  /** What it takes to win this challenge — overrides the mode default. */
  challengeType: ChallengeType;
  /** Target value: seconds for surviveTime, count for tagCount, wave # for surviveWaves. */
  target?: number;
  timeLimit?: number;
  requiredCoins?: number;
  reward: { coins: number; xp: number };
  boss?: BossData;
  starThresholds?: [number, number, number];
}

export interface CampaignChapter {
  id: string;
  name: string;
  emoji: string;
  description: string;
  challenges: CampaignChallenge[];
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: "ch1",
    name: "Boot Camp",
    emoji: "🎖️",
    description: "Learn the basics and survive your first matches.",
    challenges: [
      {
        id: "ch1_1", name: "First Steps", emoji: "👟",
        description: "Survive 30 seconds as a Runner on Suburban.",
        map: "suburban", mode: "classic", difficulty: "easy", role: "runner",
        objectives: ["Survive for 30 seconds"],
        timeLimit: 30, reward: { coins: 5, xp: 20 },
        starThresholds: [15, 22, 30],
      },
      {
        id: "ch1_2", name: "Tag Practice", emoji: "🏷️",
        description: "Tag 3 runners as a Hunter on easy.",
        map: "suburban", mode: "classic", difficulty: "easy", role: "hunter",
        objectives: ["Tag 3 runners"],
        reward: { coins: 10, xp: 40 },
        starThresholds: [25, 40, 60],
      },
      {
        id: "ch1_3", name: "Infection Escape", emoji: "🧟",
        description: "Survive an Infection match on Suburban.",
        map: "suburban", mode: "infection", difficulty: "easy", role: "runner",
        objectives: ["Survive and escape"],
        reward: { coins: 8, xp: 30 },
        starThresholds: [30, 45, 60],
      },
    ],
  },
  {
    id: "ch2",
    name: "Into the Wild",
    emoji: "🌲",
    description: "Take on tougher environments with storms and snow.",
    challenges: [
      {
        id: "ch2_1", name: "Storm Runner", emoji: "⛈️",
        description: "Survive and escape in a thunderstorm on Forest.",
        map: "forest", mode: "classic", difficulty: "medium", role: "runner",
        objectives: ["Escape through the portal"],
        reward: { coins: 12, xp: 50 },
        starThresholds: [30, 45, 60],
      },
      {
        id: "ch2_2", name: "Arctic Survivor", emoji: "❄️",
        description: "Survive 3 waves in Survival mode on Arctic.",
        map: "arctic", mode: "survival", difficulty: "medium", role: "runner",
        objectives: ["Survive 3 waves"],
        reward: { coins: 15, xp: 60 },
        starThresholds: [40, 55, 70],
      },
      {
        id: "ch2_3", name: "The Brute", emoji: "👹",
        description: "Defeat the Forest Guardian boss!",
        map: "forest", mode: "classic", difficulty: "medium", role: "runner",
        objectives: ["Defeat the Forest Guardian"],
        reward: { coins: 20, xp: 80 },
        starThresholds: [35, 50, 70],
        boss: {
          name: "Forest Guardian",
          emoji: "👹",
          healthMult: 5,
          speedMult: 1.3,
          size: 1.8,
          color: "#2a6a1a",
        },
      },
    ],
  },
  {
    id: "ch3",
    name: "Extreme Trials",
    emoji: "🔥",
    description: "Master the hardest challenges and defeat legendary bosses.",
    challenges: [
      {
        id: "ch3_1", name: "Flag Runner", emoji: "🚩",
        description: "Capture the flag on Ruins in hard mode.",
        map: "ruins", mode: "ctf", difficulty: "hard", role: "runner",
        objectives: ["Capture the flag and return to base"],
        reward: { coins: 20, xp: 80 },
        starThresholds: [40, 60, 90],
      },
      {
        id: "ch3_2", name: "Endurance", emoji: "🛡️",
        description: "Survive 8 waves on Volcano in hard mode.",
        map: "volcano", mode: "survival", difficulty: "hard", role: "runner",
        objectives: ["Survive 8 waves"],
        reward: { coins: 25, xp: 100 },
        starThresholds: [120, 140, 160],
      },
      {
        id: "ch3_3", name: "Lava Titan", emoji: "🌋",
        description: "Defeat the Lava Titan on Volcano!",
        map: "volcano", mode: "classic", difficulty: "hard", role: "runner",
        objectives: ["Defeat the Lava Titan"],
        reward: { coins: 30, xp: 120 },
        starThresholds: [40, 55, 75],
        boss: {
          name: "Lava Titan",
          emoji: "🌋",
          healthMult: 8,
          speedMult: 1.5,
          size: 2.2,
          color: "#cc3300",
        },
      },
      {
        id: "ch3_4", name: "Void King", emoji: "👑",
        description: "Defeat the final boss — the Void King!",
        map: "space_station", mode: "classic", difficulty: "hard", role: "runner",
        objectives: ["Defeat the Void King"],
        reward: { coins: 50, xp: 200 },
        starThresholds: [45, 65, 90],
        boss: {
          name: "Void King",
          emoji: "👑",
          healthMult: 12,
          speedMult: 1.6,
          size: 2.5,
          color: "#4400aa",
        },
      },
    ],
  },
];

const CAMPAIGN_STORAGE_KEY = "hide_seek_campaign";

export interface CampaignProgress {
  completed: string[];
  bestTimes: Record<string, number>;
  stars: Record<string, number>;
}

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { completed: [], bestTimes: {}, stars: {} };
    if (!data.stars) data.stars = {};
    return data;
  } catch { return { completed: [], bestTimes: {}, stars: {} }; }
}

export function saveCampaignProgress(progress: CampaignProgress) {
  localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
}

export function getStarRating(challengeId: string, time: number): number {
  for (const chapter of CAMPAIGN_CHAPTERS) {
    for (const c of chapter.challenges) {
      if (c.id === challengeId && c.starThresholds) {
        if (time <= c.starThresholds[0]) return 3;
        if (time <= c.starThresholds[1]) return 2;
        return 1;
      }
    }
  }
  return 1;
}

export function completeCampaignChallenge(id: string, time: number) {
  const progress = loadCampaignProgress();
  if (!progress.completed.includes(id)) {
    progress.completed.push(id);
  }
  if (!progress.bestTimes[id] || time < progress.bestTimes[id]) {
    progress.bestTimes[id] = time;
  }
  const stars = getStarRating(id, time);
  if (!progress.stars[id] || stars > progress.stars[id]) {
    progress.stars[id] = stars;
  }
  saveCampaignProgress(progress);
  return progress;
}

export function isChallengeUnlocked(challengeId: string): boolean {
  const progress = loadCampaignProgress();
  for (const chapter of CAMPAIGN_CHAPTERS) {
    const chapterIdx = CAMPAIGN_CHAPTERS.indexOf(chapter);
    for (let i = 0; i < chapter.challenges.length; i++) {
      if (chapter.challenges[i].id === challengeId) {
        if (i === 0) {
          if (chapterIdx === 0) return true;
          const prevChapter = CAMPAIGN_CHAPTERS[chapterIdx - 1];
          return prevChapter.challenges.every(c => progress.completed.includes(c.id));
        }
        return progress.completed.includes(chapter.challenges[i - 1].id);
      }
    }
  }
  return false;
}
