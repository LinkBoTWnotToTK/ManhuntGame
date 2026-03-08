import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerPosition, addProjectile } from "./SharedState";
import { useGame } from "./GameState";

// Weapon types for runners
export type WeaponType = "slingshot" | "shotgun" | "sniper";

export interface WeaponDef {
  id: WeaponType;
  name: string;
  emoji: string;
  projectileCount: number; // shots per fire
  spread: number; // radians
  cooldown: number; // seconds between shots
  damage: number;
  speed: number; // projectile speed multiplier
  ammoPerShot: number;
}

export const WEAPONS: Record<WeaponType, WeaponDef> = {
  slingshot: {
    id: "slingshot",
    name: "Slingshot",
    emoji: "🪃",
    projectileCount: 1,
    spread: 0,
    cooldown: 0.3,
    damage: 1,
    speed: 1,
    ammoPerShot: 1,
  },
  shotgun: {
    id: "shotgun",
    name: "Scatter Shot",
    emoji: "💥",
    projectileCount: 5,
    spread: 0.15,
    cooldown: 0.8,
    damage: 1,
    speed: 0.8,
    ammoPerShot: 2,
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    emoji: "🎯",
    projectileCount: 1,
    spread: 0,
    cooldown: 1.5,
    damage: 3,
    speed: 2,
    ammoPerShot: 3,
  },
};

// Melee attack for hunters
const MELEE_RANGE = 2.0;
const MELEE_COOLDOWN = 0.6;
const MELEE_DAMAGE = 1;
const MELEE_ARC = Math.PI / 2; // 90 degree arc

export interface MeleeState {
  cooldownLeft: number;
  isSwinging: boolean;
}

// Rock throwing (both roles can use throwable rocks found in the world)
export interface ThrowableRock {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alive: boolean;
  age: number;
  owner: string;
}

export const throwableRocks: ThrowableRock[] = [];
let rockId = 0;

export function throwRock(pos: THREE.Vector3, dir: THREE.Vector3, owner: string) {
  const vel = dir.clone().normalize().multiplyScalar(15);
  vel.y = 3; // arc upward
  throwableRocks.push({
    id: `rock_${rockId++}`,
    position: pos.clone(),
    velocity: vel,
    alive: true,
    age: 0,
    owner,
  });
}

// Rock physics component
export default function WeaponSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const meshPool = useRef<THREE.Mesh[]>([]);
  const geo = useRef<THREE.DodecahedronGeometry | null>(null);
  const mat = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((_, delta) => {
    // Update rocks
    for (const rock of throwableRocks) {
      if (!rock.alive) continue;
      rock.velocity.y -= 15 * delta; // gravity
      rock.position.addScaledVector(rock.velocity, delta);
      rock.age += delta;
      if (rock.age > 3 || rock.position.y < -1) rock.alive = false;
    }
    for (let i = throwableRocks.length - 1; i >= 0; i--) {
      if (!throwableRocks[i].alive) throwableRocks.splice(i, 1);
    }

    const group = groupRef.current;
    if (!group) return;
    if (!geo.current) geo.current = new THREE.DodecahedronGeometry(0.12, 0);
    if (!mat.current) mat.current = new THREE.MeshStandardMaterial({ color: "#888", roughness: 0.9 });

    while (meshPool.current.length < throwableRocks.length) {
      const mesh = new THREE.Mesh(geo.current, mat.current);
      mesh.castShadow = true;
      group.add(mesh);
      meshPool.current.push(mesh);
    }
    for (let i = 0; i < meshPool.current.length; i++) {
      if (i < throwableRocks.length) {
        meshPool.current[i].visible = true;
        meshPool.current[i].position.copy(throwableRocks[i].position);
        meshPool.current[i].rotation.x += delta * 10;
        meshPool.current[i].rotation.z += delta * 8;
      } else {
        meshPool.current[i].visible = false;
      }
    }
  });

  return <group ref={groupRef} />;
}
