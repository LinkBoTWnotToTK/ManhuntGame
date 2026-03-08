// Campaign system with challenge levels

import type { GameMap, GameMode, Difficulty } from "./GameState";

export interface CampaignChallenge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  map: GameMap;
  mode: GameMode;
  difficulty: Difficulty;
  role: "runner" | "hunter";
  // Win conditions / modifiers
  objectives: string[];
  timeLimit?: number; // override game duration
  requiredCoins?: number; // collect X coins to win
  reward: { coins: number; xp: number };
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
      },
      {
        id: "ch1_2", name: "Coin Collector", emoji: "🪙",
        description: "Collect 10 coins on Suburban.",
        map: "suburban", mode: "collector", difficulty: "easy", role: "runner",
        objectives: ["Collect 10 coins"], requiredCoins: 10,
        timeLimit: 45, reward: { coins: 8, xp: 30 },
      },
      {
        id: "ch1_3", name: "Tag Practice", emoji: "🏷️",
        description: "Tag 3 runners as a Hunter on easy.",
        map: "suburban", mode: "classic", difficulty: "easy", role: "hunter",
        objectives: ["Tag 3 runners"],
        reward: { coins: 10, xp: 40 },
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
      },
      {
        id: "ch2_2", name: "Arctic Survivor", emoji: "❄️",
        description: "Survive 3 waves in Survival mode on Arctic.",
        map: "arctic", mode: "survival", difficulty: "medium", role: "runner",
        objectives: ["Survive 3 waves"],
        reward: { coins: 15, xp: 60 },
      },
      {
        id: "ch2_3", name: "Flag Raider", emoji: "🚩",
        description: "Capture the flag on Industrial in the fog.",
        map: "industrial", mode: "ctf", difficulty: "medium", role: "runner",
        objectives: ["Capture the flag and return to base"],
        reward: { coins: 15, xp: 60 },
      },
    ],
  },
  {
    id: "ch3",
    name: "Extreme Trials",
    emoji: "🔥",
    description: "Master the hardest challenges across all environments.",
    challenges: [
      {
        id: "ch3_1", name: "Parkour Master", emoji: "🧗",
        description: "Complete all 5 parkour checkpoints on hard.",
        map: "volcano", mode: "parkour", difficulty: "hard", role: "runner",
        objectives: ["Reach all 5 checkpoints"],
        reward: { coins: 20, xp: 80 },
      },
      {
        id: "ch3_2", name: "Death Run", emoji: "☠️",
        description: "Complete the deathrun on Space Station.",
        map: "space_station", mode: "deathrun", difficulty: "hard", role: "runner",
        objectives: ["Reach all checkpoints without dying"],
        reward: { coins: 25, xp: 100 },
      },
      {
        id: "ch3_3", name: "Underground Hunt", emoji: "🕳️",
        description: "Tag all runners using the underground tunnels.",
        map: "underground", mode: "classic", difficulty: "hard", role: "hunter",
        objectives: ["Tag all 7 runners"],
        reward: { coins: 30, xp: 120 },
      },
      {
        id: "ch3_4", name: "Last Standing", emoji: "💀",
        description: "Win a Last Man Standing match on Volcano on hard.",
        map: "volcano", mode: "lms", difficulty: "hard", role: "runner",
        objectives: ["Be the last one standing"],
        reward: { coins: 35, xp: 150 },
      },
    ],
  },
];

const CAMPAIGN_STORAGE_KEY = "hide_seek_campaign";

export interface CampaignProgress {
  completed: string[]; // challenge IDs
  bestTimes: Record<string, number>;
}

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completed: [], bestTimes: {} };
  } catch { return { completed: [], bestTimes: {} }; }
}

export function saveCampaignProgress(progress: CampaignProgress) {
  localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
}

export function completeCampaignChallenge(id: string, time: number) {
  const progress = loadCampaignProgress();
  if (!progress.completed.includes(id)) {
    progress.completed.push(id);
  }
  if (!progress.bestTimes[id] || time < progress.bestTimes[id]) {
    progress.bestTimes[id] = time;
  }
  saveCampaignProgress(progress);
  return progress;
}

export function isChallengeUnlocked(challengeId: string): boolean {
  const progress = loadCampaignProgress();
  // First challenge of each chapter is always unlocked if previous chapter is done
  for (const chapter of CAMPAIGN_CHAPTERS) {
    const chapterIdx = CAMPAIGN_CHAPTERS.indexOf(chapter);
    for (let i = 0; i < chapter.challenges.length; i++) {
      if (chapter.challenges[i].id === challengeId) {
        if (i === 0) {
          // First challenge: unlocked if previous chapter complete or first chapter
          if (chapterIdx === 0) return true;
          const prevChapter = CAMPAIGN_CHAPTERS[chapterIdx - 1];
          return prevChapter.challenges.every(c => progress.completed.includes(c.id));
        }
        // Otherwise: previous challenge in this chapter must be completed
        return progress.completed.includes(chapter.challenges[i - 1].id);
      }
    }
  }
  return false;
}
