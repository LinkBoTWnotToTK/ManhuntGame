import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { resetSharedState } from "./SharedState";
import { POWERUPS } from "./ShopData";
import { autoSave, autoLoad, SaveData, LeaderboardEntry, saveLeaderboard, loadLeaderboard, xpForLevel, prestigeMultiplier } from "./SaveSystem";
import type { WeaponType } from "./WeaponSystem";
import { completeCampaignChallenge, type CampaignChallenge } from "./CampaignData";
import { cloudSave, cloudSaveLeaderboard, getCloudSaveCode } from "./CloudSave";
import { loadCampaignProgress } from "./CampaignData";

export type Role = "runner" | "hunter";
export type GameMap = "suburban" | "industrial" | "forest" | "arctic" | "underground" | "volcano" | "space_station" | "ruins" | "swamp" | "rooftop";
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "classic" | "infection" | "koth" | "lms" | "speedrun" | "collector" | "parkour" | "blockhunt" | "ctf" | "survival" | "deathrun" | "warfare";

export interface MapBounds {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
}

export const MAP_BOUNDS: Record<GameMap, MapBounds> = {
  suburban:       { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 29.5 },
  industrial:     { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  forest:         { minX: -44.5, maxX: 44.5, minZ: -69.5, maxZ: 34.5 },
  arctic:         { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  underground:    { minX: -34.5, maxX: 34.5, minZ: -59.5, maxZ: 24.5 },
  volcano:        { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  space_station:  { minX: -34.5, maxX: 34.5, minZ: -54.5, maxZ: 24.5 },
  ruins:          { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  swamp:          { minX: -39.5, maxX: 39.5, minZ: -64.5, maxZ: 29.5 },
  rooftop:        { minX: -34.5, maxX: 34.5, minZ: -54.5, maxZ: 24.5 },
};

export const ESCAPE_POSITIONS: Record<GameMap, [number, number, number]> = {
  suburban:       [0, 0, -54],
  industrial:     [0, 0, -59],
  forest:         [0, 0, -64],
  arctic:         [0, 0, -59],
  underground:    [0, 0, -54],
  volcano:        [0, 0, -59],
  space_station:  [0, 0, -49],
  ruins:          [0, 0, -59],
  swamp:          [0, 0, -59],
  rooftop:        [0, 0, -49],
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  hunterCount: number;
  hunterSpeedMult: number;
  hunterChaseRange: number;
  gameDuration: number;
  coinMult: number;
  xpMult: number;
  label: string;
}> = {
  easy:   { hunterCount: 3, hunterSpeedMult: 0.8, hunterChaseRange: 12, gameDuration: 75, coinMult: 0.8, xpMult: 0.8, label: "Easy" },
  medium: { hunterCount: 5, hunterSpeedMult: 1.0, hunterChaseRange: 15, gameDuration: 60, coinMult: 1.0, xpMult: 1.0, label: "Medium" },
  hard:   { hunterCount: 7, hunterSpeedMult: 1.3, hunterChaseRange: 20, gameDuration: 45, coinMult: 1.5, xpMult: 1.5, label: "Hard" },
};

export const GAME_MODES: Record<GameMode, { name: string; emoji: string; desc: string }> = {
  classic:    { name: "Classic", emoji: "🎮", desc: "Hunt or run — the original mode" },
  infection:  { name: "Infection", emoji: "🧟", desc: "Tag converts runners to hunters" },
  koth:       { name: "King of Hill", emoji: "👑", desc: "Hold the zone to score points" },
  lms:        { name: "Last Standing", emoji: "💀", desc: "Free-for-all — last alive wins" },
  speedrun:   { name: "Speed Run", emoji: "⚡", desc: "Reach all checkpoints fastest" },
  collector:  { name: "Collector", emoji: "🪙", desc: "Collect the most coins to win" },
  parkour:    { name: "Parkour", emoji: "🧗", desc: "Jump across platforms to the finish" },
  blockhunt:  { name: "Block Hunt", emoji: "📦", desc: "Hide as objects — seekers find you" },
  ctf:        { name: "Capture Flag", emoji: "🚩", desc: "Grab the flag and return to base" },
  survival:   { name: "Survival", emoji: "🛡️", desc: "Survive waves of hunters" },
  deathrun:   { name: "Death Run", emoji: "☠️", desc: "Dodge traps to reach the end" },
  warfare:    { name: "Warfare", emoji: "⚔️", desc: "Place units, capture towers — epic battle!" },
};

interface MedkitData { id: string; position: [number, number, number]; }
interface AmmoPickupData { id: string; position: [number, number, number]; }
interface CoinData { id: string; position: [number, number, number]; }

// Block Hunt specific
export const BLOCKHUNT_MAPS: GameMap[] = ["suburban", "forest", "arctic", "ruins", "rooftop"];
export const BLOCKHUNT_BLOCKS = [
  { id: "oak_log", name: "Oak Log", color: "#8B6914", emoji: "🪵" },
  { id: "stone", name: "Stone", color: "#888888", emoji: "🪨" },
  { id: "grass_block", name: "Grass Block", color: "#4a8c3f", emoji: "🟩" },
  { id: "bookshelf", name: "Bookshelf", color: "#8B5E3C", emoji: "📚" },
  { id: "tnt", name: "TNT", color: "#cc2222", emoji: "🧨" },
  { id: "melon", name: "Melon", color: "#3a7a2a", emoji: "🍈" },
  { id: "pumpkin", name: "Pumpkin", color: "#cc7722", emoji: "🎃" },
  { id: "hay_bale", name: "Hay Bale", color: "#ccaa22", emoji: "🌾" },
];

interface GameState {
  role: Role | null;
  selectedMap: GameMap | null;
  difficulty: Difficulty;
  gameMode: GameMode;
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
  coins: number;
  matchCoins: number;
  coinPickups: CoinData[];
  ownedPowerups: string[];
  speedMultiplier: number;
  staminaDrainMultiplier: number;
  maxHealth: number;
  currentWeapon: WeaponType;
  meleeCooldown: number;
  level: number;
  xp: number;
  prestige: number;
  totalWins: number;
  totalGames: number;
  leaderboard: LeaderboardEntry[];
  kothScore: number;
  kothZone: [number, number, number] | null;
  checkpoints: [number, number, number][];
  checkpointIndex: number;
  survivalWave: number;
  flagCarried: boolean;
  flagPosition: [number, number, number] | null;
  basePosition: [number, number, number] | null;
  parkourFinished: boolean;
  isDisguised: boolean;
  // Block Hunt enhanced
  blockhuntBlock: string | null;
  blockhuntStillTimer: number;
  blockhuntStunTimer: number;
  // Cosmetics
  equippedSkin: string;
  equippedTrail: string;
  equippedHat: string;
  // Hatch prompt
  nearHatch: boolean;
  hatchPromptText: string;
  setNearHatch: (near: boolean, text?: string) => void;
  // Tutorial
  tutorialActive: boolean;
  tutorialStep: number;
  startTutorial: () => void;
  advanceTutorial: () => void;
  endTutorial: () => void;
  // Campaign
  activeCampaignChallenge: CampaignChallenge | null;
  setActiveCampaignChallenge: (c: CampaignChallenge | null) => void;
  selectRole: (role: Role) => void;
  selectMap: (map: GameMap) => void;
  setDifficulty: (d: Difficulty) => void;
  setGameMode: (m: GameMode) => void;
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
  collectCoin: (id: string) => void;
  useStamina: (amount: number) => boolean;
  regenStamina: (amount: number) => void;
  buyPowerup: (id: string) => boolean;
  loadSaveData: (data: SaveData) => void;
  switchWeapon: (w: WeaponType) => void;
  setMeleeCooldown: (cd: number) => void;
  doPrestige: () => void;
  advanceCheckpoint: () => void;
  addKothScore: (pts: number) => void;
  grabFlag: () => void;
  returnFlag: () => void;
  finishParkour: () => void;
  toggleDisguise: () => void;
  advanceSurvivalWave: () => void;
  equipSkin: (id: string) => void;
  equipTrail: (id: string) => void;
  equipHat: (id: string) => void;
  setBlockhuntBlock: (block: string | null) => void;
  updateBlockhuntStillTimer: (delta: number) => void;
  applyBlockhuntStun: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

const MAX_STAMINA = 100;
const BASE_MAX_HEALTH = 3;
const RUNNER_START_AMMO = 3;
const HUNTER_START_AMMO = 0;

function spawnCoins(bounds: MapBounds, count: number): CoinData[] {
  const coins: CoinData[] = [];
  for (let i = 0; i < count; i++) {
    const x = bounds.minX + 5 + Math.random() * (bounds.maxX - bounds.minX - 10);
    const z = bounds.minZ + 5 + Math.random() * (bounds.maxZ - bounds.minZ - 10);
    coins.push({ id: `coin${i}_${Date.now()}`, position: [x, 0.3, z] });
  }
  return coins;
}

function spawnCheckpoints(bounds: MapBounds): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const x = bounds.minX + 8 + Math.random() * (bounds.maxX - bounds.minX - 16);
    const z = bounds.minZ + 8 + Math.random() * (bounds.maxZ - bounds.minZ - 16);
    pts.push([x, 0, z]);
  }
  return pts;
}

function spawnParkourCheckpoints(): [number, number, number][] {
  // Parkour checkpoints on elevated platforms — aligned with ParkourPlatforms in House.tsx
  return [
    [0, 1.5, -8],       // Stage 1: starting platform
    [-4, 3.2, -17],     // Stage 2: zigzag mid
    [0, 5, -26],        // Stage 3: bridge
    [5, 8.5, -38],      // Stage 5: floating island
    [0, 11, -52],       // Stage 6: finish platform
  ];
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);
  const [difficulty, setDifficultyState] = useState<Difficulty>("medium");
  const [gameMode, setGameModeState] = useState<GameMode>("classic");
  const [score, setScore] = useState(0);
  const [tagged, setTagged] = useState<Set<string>>(new Set());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [escaped, setEscapedState] = useState(false);
  const [stamina, setStamina] = useState(MAX_STAMINA);
  const [playerHealth, setPlayerHealth] = useState(BASE_MAX_HEALTH);
  const [playerAmmo, setPlayerAmmo] = useState(0);
  const [npcHealth, setNpcHealth] = useState<Record<string, number>>({});
  const [medkits, setMedkits] = useState<MedkitData[]>([]);
  const [ammoPickups, setAmmoPickups] = useState<AmmoPickupData[]>([]);
  const [coinPickups, setCoinPickups] = useState<CoinData[]>([]);
  const [coins, setCoins] = useState(0);
  const [matchCoins, setMatchCoins] = useState(0);
  const [ownedPowerups, setOwnedPowerups] = useState<string[]>([]);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("slingshot");
  const [meleeCooldown, setMeleeCooldownVal] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [prestige, setPrestige] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [kothScore, setKothScore] = useState(0);
  const [kothZone, setKothZone] = useState<[number, number, number] | null>(null);
  const [checkpoints, setCheckpoints] = useState<[number, number, number][]>([]);
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [survivalWave, setSurvivalWave] = useState(1);
  const [flagCarried, setFlagCarried] = useState(false);
  const [flagPosition, setFlagPosition] = useState<[number, number, number] | null>(null);
  const [basePosition, setBasePosition] = useState<[number, number, number] | null>(null);
  const [parkourFinished, setParkourFinished] = useState(false);
  const [isDisguised, setIsDisguised] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState("");
  const [equippedTrail, setEquippedTrail] = useState("");
  const [equippedHat, setEquippedHat] = useState("");
  const [nearHatch, setNearHatchState] = useState(false);
  const [hatchPromptText, setHatchPromptText] = useState("");
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeCampaignChallenge, setActiveCampaignChallengeState] = useState<CampaignChallenge | null>(null);
  const [blockhuntBlock, setBlockhuntBlockState] = useState<string | null>(null);
  const [blockhuntStillTimer, setBlockhuntStillTimer] = useState(0);
  const [blockhuntStunTimer, setBlockhuntStunTimer] = useState(0);
  const campaignChallengeRef = useRef<CampaignChallenge | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const gameOverRef = useRef(false);
  const roleRef = useRef<Role | null>(null);
  const mapRef = useRef<GameMap | null>(null);
  const diffRef = useRef<Difficulty>("medium");
  const modeRef = useRef<GameMode>("classic");
  const playerHealthRef = useRef(BASE_MAX_HEALTH);
  const playerAmmoRef = useRef(0);
  const npcHealthRef = useRef<Record<string, number>>({});
  const nextMedkitSpawn = useRef(30);
  const nextAmmoSpawn = useRef(10);
  const secondWindUsed = useRef(false);
  const ownedRef = useRef<string[]>([]);
  const kothRef = useRef(0);
  const cpRef = useRef(0);
  const waveRef = useRef(1);

  useEffect(() => {
    const saved = autoLoad();
    if (saved) {
      setCoins(saved.coins);
      setOwnedPowerups(saved.powerups);
      ownedRef.current = saved.powerups;
      setLevel(saved.level);
      setXp(saved.xp);
      setPrestige(saved.prestige);
      setTotalWins(saved.totalWins);
      setTotalGames(saved.totalGames);
      setEquippedSkin(saved.equippedSkin);
      setEquippedTrail(saved.equippedTrail);
      setEquippedHat(saved.equippedHat);
    }
    setLeaderboard(loadLeaderboard());
  }, []);

  useEffect(() => {
    const saveData: SaveData = { coins, powerups: ownedPowerups, level, xp, prestige, totalWins, totalGames, equippedSkin, equippedTrail, equippedHat };
    autoSave(saveData);
    ownedRef.current = ownedPowerups;
    // Cloud save (debounced, fire-and-forget)
    if (getCloudSaveCode()) {
      const campaignData = loadCampaignProgress();
      cloudSave(saveData, campaignData).catch(() => {});
    }
  }, [coins, ownedPowerups, level, xp, prestige, totalWins, totalGames, equippedSkin, equippedTrail, equippedHat]);

  const hasP = (id: string) => ownedPowerups.includes(id);
  const speedMultiplier = hasP("iron_boots") ? 1.2 : 1.0;
  const staminaDrainMultiplier = hasP("ghost_step") ? 0.5 : 1.0;
  const maxHealth = hasP("extra_heart") ? 4 : BASE_MAX_HEALTH;
  const ammoSpawnInterval = hasP("quick_reload") ? 6 : 10;

  const selectRole = useCallback((r: Role) => { setRole(r); roleRef.current = r; }, []);
  const selectMap = useCallback((m: GameMap) => { setSelectedMap(m); mapRef.current = m; }, []);
  const setDifficulty = useCallback((d: Difficulty) => { setDifficultyState(d); diffRef.current = d; }, []);
  const setGameMode = useCallback((m: GameMode) => { setGameModeState(m); modeRef.current = m; }, []);

  const setActiveCampaignChallenge = useCallback((c: CampaignChallenge | null) => {
    setActiveCampaignChallengeState(c);
    campaignChallengeRef.current = c;
  }, []);

  const finishGame = useCallback((result: "win" | "lose", elapsed: number) => {
    gameOverRef.current = true;
    setGameOver(true);
    setGameResult(result);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const diff = DIFFICULTY_SETTINGS[diffRef.current];
    const pMult = prestigeMultiplier(prestige);
    let coinReward = Math.floor((result === "win" ? 5 : 2) * diff.coinMult * pMult);
    let xpReward = Math.floor((result === "win" ? 30 : 10) * diff.xpMult * pMult);

    // Campaign challenge completion
    const cc = campaignChallengeRef.current;
    if (cc && result === "win") {
      // Check objectives
      let objectiveMet = true;
      if (cc.timeLimit && elapsed > cc.timeLimit) objectiveMet = false;
      // requiredCoins checked against matchCoins would need access - for now treat win as success
      
      if (objectiveMet) {
        completeCampaignChallenge(cc.id, elapsed);
        coinReward += cc.reward.coins;
        xpReward += cc.reward.xp;
      }
    }

    setCoins(prev => prev + coinReward);
    setTotalGames(prev => prev + 1);
    if (result === "win") setTotalWins(prev => prev + 1);

    setXp(prev => {
      let newXp = prev + xpReward;
      let newLevel = level;
      while (newXp >= xpForLevel(newLevel)) {
        newXp -= xpForLevel(newLevel);
        newLevel++;
      }
      if (newLevel !== level) setLevel(newLevel);
      return newXp;
    });

    const entry: LeaderboardEntry = {
      mode: modeRef.current,
      role: roleRef.current || "runner",
      map: mapRef.current || "suburban",
      difficulty: diffRef.current,
      time: elapsed,
      result,
      score: 0,
      date: Date.now(),
    };
    setLeaderboard(prev => {
      const next = [entry, ...prev].slice(0, 50);
      saveLeaderboard(next);
      return next;
    });

    // Cloud save leaderboard entry
    cloudSaveLeaderboard(entry).catch(() => {});
  }, [level, prestige]);

  const startGame = useCallback(() => {
    resetSharedState();
    const owned = ownedRef.current;
    const extraAmmo = owned.includes("lucky_start") ? 2 : 0;
    const mode = modeRef.current;
    const isBlockHunt = mode === "blockhunt";
    
    // Block Hunt: 10 hearts, 5 ammo for runners, random map from 5
    const currentMaxHealth = isBlockHunt ? 10 : (owned.includes("extra_heart") ? 4 : BASE_MAX_HEALTH);
    const startAmmo = isBlockHunt 
      ? (roleRef.current === "runner" ? 5 : 0) 
      : (roleRef.current === "runner" ? RUNNER_START_AMMO + extraAmmo : HUNTER_START_AMMO);
    const ammoInterval = owned.includes("quick_reload") ? 6 : 10;
    const diff = DIFFICULTY_SETTINGS[diffRef.current];
    const duration = isBlockHunt ? 300 : mode === "survival" ? 999 : mode === "parkour" ? 120 : mode === "deathrun" ? 90 : diff.gameDuration;
    
    // Block Hunt: pick random map if not already set from block hunt maps
    if (isBlockHunt) {
      const randomMap = BLOCKHUNT_MAPS[Math.floor(Math.random() * BLOCKHUNT_MAPS.length)];
      setSelectedMap(randomMap);
      mapRef.current = randomMap;
    }

    setScore(0);
    setTagged(new Set());
    setGameOver(false);
    setGameResult(null);
    setIsPlaying(true);
    setEscapeOpen(false);
    setEscapedState(false);
    setStamina(MAX_STAMINA);
    setPlayerHealth(currentMaxHealth);
    setPlayerAmmo(startAmmo);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    setMatchCoins(0);
    setKothScore(0);
    kothRef.current = 0;
    setCheckpointIndex(0);
    cpRef.current = 0;
    setSurvivalWave(1);
    waveRef.current = 1;
    setFlagCarried(false);
    setParkourFinished(false);
    setIsDisguised(false);
    setBlockhuntBlockState(null);
    setBlockhuntStillTimer(0);
    setBlockhuntStunTimer(0);
    playerHealthRef.current = currentMaxHealth;
    playerAmmoRef.current = startAmmo;
    npcHealthRef.current = {};
    nextMedkitSpawn.current = 30;
    nextAmmoSpawn.current = ammoInterval;
    gameOverRef.current = false;
    secondWindUsed.current = false;
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    const bounds = MAP_BOUNDS[mapRef.current || "suburban"];
    const coinCount = mode === "collector" ? 40 : 18;
    setCoinPickups(spawnCoins(bounds, coinCount));

    // KOTH zone
    if (mode === "koth") {
      const zx = bounds.minX + 10 + Math.random() * (bounds.maxX - bounds.minX - 20);
      const zz = bounds.minZ + 10 + Math.random() * (bounds.maxZ - bounds.minZ - 20);
      setKothZone([zx, 0, zz]);
    } else { setKothZone(null); }

    // Speedrun / Parkour checkpoints
    if (mode === "speedrun") {
      setCheckpoints(spawnCheckpoints(bounds));
    } else if (mode === "parkour") {
      setCheckpoints(spawnParkourCheckpoints());
    } else if (mode === "deathrun") {
      // Deathrun uses linear checkpoints along the run
      setCheckpoints([
        [0, 0, -15], [0, 0, -25], [0, 0, -35], [0, 0, -45], [0, 0, -52],
      ]);
    } else { setCheckpoints([]); }

    // CTF
    if (mode === "ctf") {
      const fx = bounds.minX + 10 + Math.random() * (bounds.maxX - bounds.minX - 20);
      const fz = bounds.minZ + 10;
      setFlagPosition([fx, 0.5, fz]);
      setBasePosition([0, 0, 5]); // near player start
    } else {
      setFlagPosition(null);
      setBasePosition(null);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (gameOverRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      if (modeRef.current === "classic" || modeRef.current === "infection") {
        if (elapsed >= duration) setEscapeOpen(true);
      }

      if (modeRef.current === "collector" && elapsed >= duration) {
        finishGame("win", elapsed);
        return;
      }

      if (modeRef.current === "koth" && kothRef.current >= 100) {
        finishGame("win", elapsed);
        return;
      }

      // Survival: advance waves every 20s
      if (modeRef.current === "survival") {
        const newWave = Math.floor(elapsed / 20) + 1;
        if (newWave > waveRef.current) {
          waveRef.current = newWave;
          setSurvivalWave(newWave);
        }
      }

      // Parkour / Deathrun timeout
      if ((modeRef.current === "parkour" || modeRef.current === "deathrun") && elapsed >= duration) {
        finishGame("lose", elapsed);
        return;
      }

      const b = MAP_BOUNDS[mapRef.current || "suburban"];

      if (elapsed >= nextMedkitSpawn.current) {
        nextMedkitSpawn.current += 30;
        const x = b.minX + 5 + Math.random() * (b.maxX - b.minX - 10);
        const z = b.minZ + 5 + Math.random() * (b.maxZ - b.minZ - 10);
        setMedkits(prev => [...prev.slice(-4), { id: `m${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      if (roleRef.current === "runner" && elapsed >= nextAmmoSpawn.current) {
        nextAmmoSpawn.current += ammoInterval;
        const x = b.minX + 5 + Math.random() * (b.maxX - b.minX - 10);
        const z = b.minZ + 5 + Math.random() * (b.maxZ - b.minZ - 10);
        setAmmoPickups(prev => [...prev.slice(-6), { id: `a${Date.now()}`, position: [x, 0.3, z] as [number, number, number] }]);
      }

      if ((modeRef.current === "classic" || modeRef.current === "infection") && elapsed >= duration + 15) {
        finishGame("lose", elapsed);
      }

      if (modeRef.current === "lms" && elapsed >= duration + 30) {
        finishGame("win", elapsed);
      }

      // Block hunt: if time runs out as hider, you win
      if (modeRef.current === "blockhunt" && elapsed >= duration + 30) {
        finishGame(roleRef.current === "runner" ? "win" : "lose", elapsed);
      }
    }, 100);
  }, [finishGame]);

  const diff = DIFFICULTY_SETTINGS[difficulty];
  const totalNPCs = role === "hunter" ? 7 : diff.hunterCount;

  const tagNPC = useCallback((id: string) => {
    setTagged(prev => {
      if (prev.has(id) || gameOverRef.current) return prev;
      const next = new Set(prev);
      next.add(id);

      const isHunter = roleRef.current === "hunter";
      const enemyTotal = isHunter ? 7 : DIFFICULTY_SETTINGS[diffRef.current].hunterCount;
      let enemyCount = 0;
      for (const tid of next) {
        if (isHunter && tid.startsWith("r")) enemyCount++;
        if (!isHunter && tid.startsWith("h") && !tid.startsWith("ah")) enemyCount++;
      }
      setScore(enemyCount);

      if (enemyCount >= enemyTotal && (modeRef.current === "classic" || modeRef.current === "infection" || modeRef.current === "lms" || modeRef.current === "blockhunt")) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        finishGame("win", elapsed);
      }
      return next;
    });
  }, [finishGame]);

  const setEscaped = useCallback(() => {
    setEscapedState(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    finishGame("win", elapsed);
  }, [finishGame]);

  const damagePlayer = useCallback((amount: number) => {
    if (gameOverRef.current) return;
    // Block Hunt: if caught while NOT disguised, lose ALL hearts instantly
    const isBlockHunt = modeRef.current === "blockhunt";
    let dmg: number;
    if (isBlockHunt) {
      // In blockhunt: runner slingshot does 2 hearts + stun handled separately
      // Hunter sword does 2 hearts. If not disguised and melee tagged, instant kill
      dmg = amount;
    } else {
      dmg = ownedRef.current.includes("thick_skin") ? Math.max(1, Math.ceil(amount / 2)) : amount;
    }
    playerHealthRef.current = Math.max(0, playerHealthRef.current - dmg);
    setPlayerHealth(playerHealthRef.current);
    if (playerHealthRef.current <= 0) {
      if (ownedRef.current.includes("second_wind") && !secondWindUsed.current && !isBlockHunt) {
        secondWindUsed.current = true;
        playerHealthRef.current = 1;
        setPlayerHealth(1);
        return;
      }
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      finishGame("lose", elapsed);
    }
  }, [finishGame]);

  const damageNPC = useCallback((id: string, amount: number) => {
    const current = npcHealthRef.current[id] ?? 3;
    npcHealthRef.current[id] = Math.max(0, current - amount);
    setNpcHealth({ ...npcHealthRef.current });
  }, []);

  const healPlayer = useCallback(() => {
    const mh = ownedRef.current.includes("extra_heart") ? 4 : BASE_MAX_HEALTH;
    playerHealthRef.current = Math.min(mh, playerHealthRef.current + 1);
    setPlayerHealth(playerHealthRef.current);
  }, []);

  const useAmmoFn = useCallback(() => {
    if (roleRef.current !== "runner") return false;
    if (playerAmmoRef.current <= 0) return false;
    playerAmmoRef.current--;
    setPlayerAmmo(playerAmmoRef.current);
    return true;
  }, []);

  const collectMedkit = useCallback((id: string) => { setMedkits(prev => prev.filter(m => m.id !== id)); }, []);
  const collectAmmo = useCallback((id: string) => {
    setAmmoPickups(prev => prev.filter(a => a.id !== id));
    playerAmmoRef.current += 2;
    setPlayerAmmo(playerAmmoRef.current);
  }, []);

  const collectCoin = useCallback((id: string) => {
    setCoinPickups(prev => prev.filter(c => c.id !== id));
    const pMult = prestigeMultiplier(prestige);
    setCoins(prev => prev + Math.floor(1 * pMult));
    setMatchCoins(prev => prev + 1);
  }, [prestige]);

  const useStaminaFn = useCallback((amount: number) => {
    let canUse = false;
    setStamina(prev => { if (prev >= amount) { canUse = true; return prev - amount; } return prev; });
    return canUse;
  }, []);

  const regenStamina = useCallback((amount: number) => {
    setStamina(prev => Math.min(MAX_STAMINA, prev + amount));
  }, []);

  const buyPowerup = useCallback((id: string): boolean => {
    const def = POWERUPS.find(p => p.id === id);
    if (!def) return false;
    let success = false;
    setOwnedPowerups(prev => {
      if (prev.includes(id)) return prev;
      setCoins(prevCoins => {
        if (prevCoins >= def.cost) { success = true; return prevCoins - def.cost; }
        return prevCoins;
      });
      if (success) return [...prev, id];
      return prev;
    });
    return success;
  }, []);

  const loadSaveData = useCallback((data: SaveData) => {
    setCoins(data.coins);
    setOwnedPowerups(data.powerups);
    setLevel(data.level);
    setXp(data.xp);
    setPrestige(data.prestige);
    setTotalWins(data.totalWins);
    setTotalGames(data.totalGames);
    setEquippedSkin(data.equippedSkin);
    setEquippedTrail(data.equippedTrail);
    setEquippedHat(data.equippedHat);
  }, []);

  const equipSkin = useCallback((id: string) => setEquippedSkin(id), []);
  const equipTrail = useCallback((id: string) => setEquippedTrail(id), []);
  const equipHat = useCallback((id: string) => setEquippedHat(id), []);
  const setNearHatch = useCallback((near: boolean, text?: string) => {
    setNearHatchState(near);
    setHatchPromptText(text || "");
  }, []);
  const startTutorial = useCallback(() => { setTutorialActive(true); setTutorialStep(0); }, []);
  const advanceTutorial = useCallback(() => setTutorialStep(prev => prev + 1), []);
  const endTutorial = useCallback(() => { setTutorialActive(false); setTutorialStep(0); }, []);

  const switchWeapon = useCallback((w: WeaponType) => setCurrentWeapon(w), []);
  const setMeleeCooldown = useCallback((cd: number) => setMeleeCooldownVal(cd), []);

  const doPrestige = useCallback(() => {
    if (level < 10) return;
    setPrestige(prev => prev + 1);
    setLevel(1);
    setXp(0);
    setOwnedPowerups([]);
  }, [level]);

  const advanceCheckpoint = useCallback(() => {
    cpRef.current++;
    setCheckpointIndex(cpRef.current);
    const maxCp = modeRef.current === "parkour" || modeRef.current === "deathrun" ? 5 : 5;
    if (cpRef.current >= maxCp) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      finishGame("win", elapsed);
    }
  }, [finishGame]);

  const addKothScore = useCallback((pts: number) => {
    kothRef.current += pts;
    setKothScore(kothRef.current);
  }, []);

  const grabFlag = useCallback(() => {
    setFlagCarried(true);
  }, []);

  const returnFlag = useCallback(() => {
    if (!flagCarried) return;
    setFlagCarried(false);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    finishGame("win", elapsed);
  }, [flagCarried, finishGame]);

  const finishParkour = useCallback(() => {
    setParkourFinished(true);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    finishGame("win", elapsed);
  }, [finishGame]);

  const toggleDisguise = useCallback(() => {
    setIsDisguised(prev => !prev);
  }, []);

  const setBlockhuntBlock = useCallback((block: string | null) => {
    setBlockhuntBlockState(block);
  }, []);

  const updateBlockhuntStillTimer = useCallback((delta: number) => {
    setBlockhuntStillTimer(prev => {
      const newVal = prev + delta;
      // After 3 seconds still, auto-disguise
      if (newVal >= 3 && !isDisguised && gameMode === "blockhunt" && blockhuntBlock) {
        setIsDisguised(true);
      }
      return newVal;
    });
  }, [isDisguised, gameMode, blockhuntBlock]);

  const applyBlockhuntStun = useCallback(() => {
    setBlockhuntStunTimer(1); // 1 second stun
    // Decay stun timer via game loop
  }, []);

  const advanceSurvivalWave = useCallback(() => {
    waveRef.current++;
    setSurvivalWave(waveRef.current);
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
    setPlayerHealth(BASE_MAX_HEALTH);
    setPlayerAmmo(0);
    setNpcHealth({});
    setMedkits([]);
    setAmmoPickups([]);
    setCoinPickups([]);
    setMatchCoins(0);
    setKothScore(0);
    setKothZone(null);
    setCheckpoints([]);
    setCheckpointIndex(0);
    setSurvivalWave(1);
    setFlagCarried(false);
    setFlagPosition(null);
    setBasePosition(null);
    setParkourFinished(false);
    setIsDisguised(false);
    setBlockhuntBlockState(null);
    setBlockhuntStillTimer(0);
    setBlockhuntStunTimer(0);
    playerHealthRef.current = BASE_MAX_HEALTH;
    playerAmmoRef.current = 0;
    npcHealthRef.current = {};
    gameOverRef.current = false;
    roleRef.current = null;
    mapRef.current = null;
    kothRef.current = 0;
    cpRef.current = 0;
    waveRef.current = 1;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const gameDuration = gameMode === "blockhunt" ? 300 : gameMode === "survival" ? 999 : gameMode === "parkour" ? 120 : gameMode === "deathrun" ? 90 : DIFFICULTY_SETTINGS[difficulty].gameDuration;
  const timeLeft = Math.max(0, gameDuration - elapsedTime);

  return (
    <GameContext.Provider
      value={{
        role, selectedMap, difficulty, gameMode,
        score, totalNPCs, tagged, elapsedTime, timeLeft,
        gameOver, gameResult, isPlaying, escapeOpen, escaped,
        stamina, maxStamina: MAX_STAMINA,
        playerHealth, playerAmmo, npcHealth, medkits, ammoPickups,
        coins, matchCoins, coinPickups, ownedPowerups,
        speedMultiplier, staminaDrainMultiplier, maxHealth,
        currentWeapon, meleeCooldown,
        level, xp, prestige, totalWins, totalGames, leaderboard,
        kothScore, kothZone, checkpoints, checkpointIndex,
        survivalWave, flagCarried, flagPosition, basePosition,
        parkourFinished, isDisguised,
        blockhuntBlock, blockhuntStillTimer, blockhuntStunTimer,
        equippedSkin, equippedTrail, equippedHat,
        nearHatch, hatchPromptText, setNearHatch,
        tutorialActive, tutorialStep, startTutorial, advanceTutorial, endTutorial,
        activeCampaignChallenge, setActiveCampaignChallenge,
        selectRole, selectMap, setDifficulty, setGameMode,
        tagNPC, startGame, resetGame, setEscaped,
        damagePlayer, damageNPC, healPlayer, useAmmo: useAmmoFn,
        collectMedkit, collectAmmo, collectCoin,
        useStamina: useStaminaFn, regenStamina,
        buyPowerup, loadSaveData,
        switchWeapon, setMeleeCooldown,
        doPrestige, advanceCheckpoint, addKothScore,
        grabFlag, returnFlag, finishParkour,
        toggleDisguise, advanceSurvivalWave,
        equipSkin, equipTrail, equipHat,
        setBlockhuntBlock, updateBlockhuntStillTimer, applyBlockhuntStun,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
