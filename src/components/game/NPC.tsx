import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";
import { wallColliders } from "./House";

interface NPCProps {
  id: string;
  startPosition: [number, number, number];
  color: string;
  npcRole: "runner" | "hunter";
}

// Runner NPCs: smarter, faster, dodge and juke, hide behind cover
const RUNNER_BASE_SPEED = 3.8;
const RUNNER_SPRINT_SPEED = 5.0;
// Hunter NPCs: slower, predictable, but persistent
const HUNTER_BASE_SPEED = 2.4;
const HUNTER_SPRINT_SPEED = 3.0;
const NPC_RADIUS = 0.3;
const TAG_DISTANCE = 1.2;

function NPCFigure({ color, npcRole }: { color: string; npcRole: string }) {
  const isHunter = npcRole === "hunter";
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[isHunter ? 0.17 : 0.14, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[isHunter ? 0.14 : 0.11, isHunter ? 0.45 : 0.35, 6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.2, 1.1, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.2, 1.1, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.07, 0.5, 0]}>
        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.07, 0.5, 0]}>
        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.05, 1.53, 0.11]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={isHunter ? "#ff0000" : "#ffffff"} emissive={isHunter ? "#ff0000" : "#ffffff"} emissiveIntensity={isHunter ? 1.5 : 0.5} />
      </mesh>
      <mesh position={[-0.05, 1.53, 0.11]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={isHunter ? "#ff0000" : "#ffffff"} emissive={isHunter ? "#ff0000" : "#ffffff"} emissiveIntensity={isHunter ? 1.5 : 0.5} />
      </mesh>
    </group>
  );
}

function checkCollision(pos: THREE.Vector3): boolean {
  const pMin = new THREE.Vector3(pos.x - NPC_RADIUS, 0, pos.z - NPC_RADIUS);
  const pMax = new THREE.Vector3(pos.x + NPC_RADIUS, 2, pos.z + NPC_RADIUS);
  for (const c of wallColliders) {
    if (pMin.x < c.max.x && pMax.x > c.min.x && pMin.y < c.max.y && pMax.y > c.min.y && pMin.z < c.max.z && pMax.z > c.min.z) {
      return true;
    }
  }
  return false;
}

function tryMove(myPos: THREE.Vector3, moveDir: THREE.Vector3, speed: number, delta: number): boolean {
  const newPos = myPos.clone().add(moveDir.clone().normalize().multiplyScalar(speed * delta));
  newPos.x = THREE.MathUtils.clamp(newPos.x, -13.5, 13.5);
  newPos.z = THREE.MathUtils.clamp(newPos.z, -23.5, 14.5);
  if (!checkCollision(newPos)) {
    myPos.copy(newPos);
    return true;
  }
  // Try sliding
  const slideX = myPos.clone();
  slideX.x += moveDir.x * speed * delta;
  if (!checkCollision(slideX)) { myPos.x = slideX.x; return true; }
  const slideZ = myPos.clone();
  slideZ.z += moveDir.z * speed * delta;
  if (!checkCollision(slideZ)) { myPos.z = slideZ.z; return true; }
  // Try perpendicular
  const perp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
  const altPos = myPos.clone().add(perp.multiplyScalar(speed * delta));
  if (!checkCollision(altPos)) { myPos.copy(altPos); return true; }
  return false;
}

export default function NPC({ id, startPosition, color, npcRole }: NPCProps) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...startPosition));
  const { tagged, tagNPC, isPlaying, setCaught } = useGame();
  const wanderDir = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const wanderTimer = useRef(Math.random() * 2);
  const jukeTimer = useRef(0);
  const jukeDir = useRef(1);
  const isTagged = tagged.has(id);
  const lastMoveDir = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!ref.current || !isPlaying || isTagged) return;

    const camPos = state.camera.position;
    const myPos = posRef.current;
    const toPlayer = new THREE.Vector3().subVectors(camPos, myPos);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const t = state.clock.elapsedTime;

    let moveDir = new THREE.Vector3();
    let speed: number;

    if (npcRole === "runner") {
      // SMART RUNNER AI
      const fleeRange = 10;
      const panicRange = 4;
      const isSprinting = dist < panicRange;
      speed = isSprinting ? RUNNER_SPRINT_SPEED : RUNNER_BASE_SPEED;

      if (dist < fleeRange) {
        // Flee away from player
        moveDir.copy(toPlayer).normalize().multiplyScalar(-1);

        // Juke/dodge: periodically shift direction perpendicular
        jukeTimer.current -= delta;
        if (jukeTimer.current <= 0) {
          jukeDir.current = Math.random() > 0.5 ? 1 : -1;
          jukeTimer.current = 0.5 + Math.random() * 1.0;
        }

        // More aggressive juking when very close
        const jukeFactor = dist < panicRange ? 0.7 : 0.3;
        const perp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).multiplyScalar(jukeDir.current * jukeFactor);
        moveDir.add(perp).normalize();

        // Avoid corners by trending toward center when near bounds
        if (Math.abs(myPos.x) > 11) moveDir.x -= Math.sign(myPos.x) * 0.5;
        if (myPos.z > 12 || myPos.z < -21) moveDir.z -= Math.sign(myPos.z) * 0.5;
        moveDir.normalize();
      } else {
        // Wander intelligently — move around, explore
        wanderTimer.current -= delta;
        if (wanderTimer.current <= 0) {
          // Pick a random point and head toward it
          const targetX = (Math.random() - 0.5) * 24;
          const targetZ = -5 + (Math.random() - 0.5) * 30;
          wanderDir.current.set(targetX - myPos.x, 0, targetZ - myPos.z).normalize();
          wanderTimer.current = 3 + Math.random() * 4;
        }
        moveDir.copy(wanderDir.current);
        speed = RUNNER_BASE_SPEED * 0.6;
      }
    } else {
      // HUNTER AI — slower but persistent, with slight prediction
      const chaseRange = 15;
      const isSprinting = dist < 6;
      speed = isSprinting ? HUNTER_SPRINT_SPEED : HUNTER_BASE_SPEED;

      if (dist < chaseRange) {
        // Chase with slight prediction — aim ahead of player movement
        moveDir.copy(toPlayer).normalize();

        // Add some wobble to make hunters feel less robotic
        const wobble = Math.sin(t * 3 + parseInt(id.replace(/\D/g, '')) * 2) * 0.15;
        moveDir.x += wobble;
        moveDir.normalize();
      } else {
        // Patrol — wander toward player's general area
        wanderTimer.current -= delta;
        if (wanderTimer.current <= 0) {
          wanderDir.current.set(
            camPos.x + (Math.random() - 0.5) * 10 - myPos.x,
            0,
            camPos.z + (Math.random() - 0.5) * 10 - myPos.z
          ).normalize();
          wanderTimer.current = 2 + Math.random() * 3;
        }
        moveDir.copy(wanderDir.current);
        speed = HUNTER_BASE_SPEED * 0.5;
      }
    }

    if (moveDir.length() > 0) {
      tryMove(myPos, moveDir, speed, delta);
      lastMoveDir.current.copy(moveDir);
    }

    ref.current.position.copy(myPos);

    // Face movement direction
    if (lastMoveDir.current.length() > 0.1) {
      const targetRot = Math.atan2(lastMoveDir.current.x, lastMoveDir.current.z);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot, 0.12);
    }

    // Running animation
    if (moveDir.length() > 0.1) {
      const runSpeed = speed > 3 ? 14 : 8;
      ref.current.position.y = Math.abs(Math.sin(t * runSpeed)) * 0.06;
    } else {
      ref.current.position.y = 0;
    }

    // Tagging
    if (npcRole === "runner" && dist < TAG_DISTANCE) {
      tagNPC(id);
    }
    if (npcRole === "hunter" && dist < TAG_DISTANCE) {
      setCaught();
    }
  });

  if (isTagged) return null;

  return (
    <group ref={ref} position={startPosition}>
      <NPCFigure color={color} npcRole={npcRole} />
      <pointLight
        color={npcRole === "hunter" ? "#ff2200" : "#00ccff"}
        intensity={npcRole === "hunter" ? 1.5 : 0.8}
        distance={npcRole === "hunter" ? 5 : 3}
        position={[0, 2, 0]}
      />
    </group>
  );
}

// 7 runner NPCs for hunter mode (harder to catch)
export const RUNNER_NPCS: Omit<NPCProps, "npcRole">[] = [
  { id: "r1", startPosition: [-10, 0, -10], color: "#4ecdc4" },
  { id: "r2", startPosition: [10, 0, -14], color: "#feca57" },
  { id: "r3", startPosition: [-12, 0, -18], color: "#ff9ff3" },
  { id: "r4", startPosition: [12, 0, -8], color: "#a8e6cf" },
  { id: "r5", startPosition: [0, 0, 12], color: "#c792ea" },
  { id: "r6", startPosition: [-8, 0, 8], color: "#48dbfb" },
  { id: "r7", startPosition: [6, 0, -20], color: "#f8b500" },
];

// 3 hunter NPCs for runner mode (easier to evade)
export const HUNTER_NPCS: Omit<NPCProps, "npcRole">[] = [
  { id: "h1", startPosition: [-10, 0, -15], color: "#ff3333" },
  { id: "h2", startPosition: [10, 0, -12], color: "#ff5533" },
  { id: "h3", startPosition: [0, 0, -20], color: "#cc2222" },
];
