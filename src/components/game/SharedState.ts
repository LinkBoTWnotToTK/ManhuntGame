import * as THREE from "three";

export const playerPosition = new THREE.Vector3(0, 0, 4);
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

export function resetSharedState() {
  playerPosition.set(0, 0, 4);
  npcPositions.clear();
  projectiles.length = 0;
  nextId = 0;
}
