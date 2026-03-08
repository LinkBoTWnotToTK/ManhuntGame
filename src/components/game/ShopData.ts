export interface PowerupDef {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
  category: "powerup" | "skin" | "trail" | "hat";
}

export const POWERUPS: PowerupDef[] = [
  // Powerups
  { id: "iron_boots", name: "Iron Boots", emoji: "🥾", cost: 10, description: "+20% movement speed", category: "powerup" },
  { id: "extra_heart", name: "Extra Heart", emoji: "💖", cost: 15, description: "Start with 4 max hearts", category: "powerup" },
  { id: "quick_reload", name: "Quick Reload", emoji: "⚡", cost: 12, description: "Ammo spawns 40% faster", category: "powerup" },
  { id: "ghost_step", name: "Ghost Step", emoji: "👻", cost: 20, description: "Sprint drains 50% less stamina", category: "powerup" },
  { id: "thick_skin", name: "Thick Skin", emoji: "🛡️", cost: 18, description: "Take half projectile damage", category: "powerup" },
  { id: "eagle_eye", name: "Eagle Eye", emoji: "🦅", cost: 8, description: "Wider field of view", category: "powerup" },
  { id: "lucky_start", name: "Lucky Start", emoji: "🍀", cost: 10, description: "Start with +2 extra ammo (runner)", category: "powerup" },
  { id: "second_wind", name: "Second Wind", emoji: "💨", cost: 25, description: "Auto-heal once at 0 HP per game", category: "powerup" },
  // Skins
  { id: "skin_ninja", name: "Ninja", emoji: "🥷", cost: 30, description: "Dark stealth outfit", category: "skin" },
  { id: "skin_robot", name: "Robot", emoji: "🤖", cost: 35, description: "Chrome metallic body", category: "skin" },
  { id: "skin_pirate", name: "Pirate", emoji: "🏴‍☠️", cost: 25, description: "Swashbuckler look", category: "skin" },
  { id: "skin_astronaut", name: "Astronaut", emoji: "👨‍🚀", cost: 40, description: "Space suit with visor", category: "skin" },
  { id: "skin_knight", name: "Knight", emoji: "⚔️", cost: 45, description: "Medieval armor set", category: "skin" },
  { id: "skin_cyber", name: "Cyberpunk", emoji: "🌆", cost: 50, description: "Neon-glow cyber outfit", category: "skin" },
  // Trails
  { id: "trail_fire", name: "Fire Trail", emoji: "🔥", cost: 15, description: "Flames follow your steps", category: "trail" },
  { id: "trail_ice", name: "Ice Trail", emoji: "❄️", cost: 15, description: "Frost crystals behind you", category: "trail" },
  { id: "trail_rainbow", name: "Rainbow Trail", emoji: "🌈", cost: 20, description: "Colorful sparkle path", category: "trail" },
  { id: "trail_shadow", name: "Shadow Trail", emoji: "🌑", cost: 20, description: "Dark mist follows you", category: "trail" },
  // Hats
  { id: "hat_crown", name: "Crown", emoji: "👑", cost: 50, description: "Royal golden crown", category: "hat" },
  { id: "hat_tophat", name: "Top Hat", emoji: "🎩", cost: 20, description: "Fancy gentleman's hat", category: "hat" },
  { id: "hat_halo", name: "Halo", emoji: "😇", cost: 30, description: "Glowing angelic halo", category: "hat" },
  { id: "hat_horns", name: "Devil Horns", emoji: "😈", cost: 25, description: "Fiery demonic horns", category: "hat" },
];

export const SKIN_COLORS: Record<string, { body: string; accent: string; pants: string; glow: string }> = {
  default_runner: { body: "#1a3a8a", accent: "#3388ff", pants: "#1a1a3a", glow: "#3388ff" },
  default_hunter: { body: "#8B4513", accent: "#ff6600", pants: "#3a2a1a", glow: "#ff6600" },
  skin_ninja:     { body: "#1a1a1a", accent: "#333333", pants: "#0a0a0a", glow: "#666666" },
  skin_robot:     { body: "#8899aa", accent: "#44ffff", pants: "#556677", glow: "#44ffff" },
  skin_pirate:    { body: "#5a2a0a", accent: "#cc8844", pants: "#2a1a0a", glow: "#cc8844" },
  skin_astronaut: { body: "#cccccc", accent: "#4488ff", pants: "#aaaaaa", glow: "#4488ff" },
  skin_knight:    { body: "#777788", accent: "#ffcc44", pants: "#555566", glow: "#ffcc44" },
  skin_cyber:     { body: "#1a0a2a", accent: "#ff00ff", pants: "#0a0a1a", glow: "#ff00ff" },
};
