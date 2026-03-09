import * as THREE from "three";

export const playerPosition = new THREE.Vector3(0, 0, 4);
export let playerY = 0; // Vertical position for jumping
export let playerVelocityY = 0;
export function setPlayerY(y: number) { playerY = y; }
export function setPlayerVelocityY(vy: number) { playerVelocityY = vy; }

export const npcPositions: Map<string, THREE.Vector3> = new Map();

export interface Projectile {
  id: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  owner: string;
  alive: boolean;
  age: number;
}

export const projectiles: Projectile[] = [];
let nextId = 0;

export function addProjectile(pos: THREE.Vector3, dir: THREE.Vector3, owner: string) {
  projectiles.push({
    id: nextId++,
    position: pos.clone(),
    direction: dir.clone().normalize(),
    owner,
    alive: true,
    age: 0,
  });
}

// Platform colliders for vertical gameplay
export interface PlatformCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
}
export const platformColliders: PlatformCollider[] = [];

export function addPlatformCollider(pos: [number, number, number], size: [number, number, number]) {
  const halfSize = size.map(s => s / 2);
  platformColliders.push({
    min: new THREE.Vector3(pos[0] - halfSize[0], pos[1] - halfSize[1], pos[2] - halfSize[2]),
    max: new THREE.Vector3(pos[0] + halfSize[0], pos[1] + halfSize[1], pos[2] + halfSize[2]),
  });
}

// Block Hunt: player disguise state
export let disguisedAs: string | null = null;
export function setDisguise(blockType: string | null) { disguisedAs = blockType; }

// Mobile input state (shared globally for Player.tsx to read)
export const mobileJoystick = { x: 0, y: 0 };
export const mobileCameraDelta = { x: 0, y: 0 };
export const mobileButtons: Record<string, boolean> = {
  jump: false,
  shoot: false,
  sprint: false,
  disguise: false,
};

export function resetSharedState() {
  playerPosition.set(0, 0, 4);
  playerY = 0;
  playerVelocityY = 0;
  npcPositions.clear();
  projectiles.length = 0;
  nextId = 0;
  disguisedAs = null;
}
