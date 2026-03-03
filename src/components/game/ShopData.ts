export interface PowerupDef {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string;
}

export const POWERUPS: PowerupDef[] = [
  { id: "iron_boots", name: "Iron Boots", emoji: "🥾", cost: 10, description: "+20% movement speed" },
  { id: "extra_heart", name: "Extra Heart", emoji: "💖", cost: 15, description: "Start with 4 max hearts" },
  { id: "quick_reload", name: "Quick Reload", emoji: "⚡", cost: 12, description: "Ammo spawns 40% faster" },
  { id: "ghost_step", name: "Ghost Step", emoji: "👻", cost: 20, description: "Sprint drains 50% less stamina" },
  { id: "thick_skin", name: "Thick Skin", emoji: "🛡️", cost: 18, description: "Take half projectile damage" },
  { id: "eagle_eye", name: "Eagle Eye", emoji: "🦅", cost: 8, description: "Wider field of view" },
  { id: "lucky_start", name: "Lucky Start", emoji: "🍀", cost: 10, description: "Start with +2 extra ammo (runner)" },
  { id: "second_wind", name: "Second Wind", emoji: "💨", cost: 25, description: "Auto-heal once at 0 HP per game" },
];
