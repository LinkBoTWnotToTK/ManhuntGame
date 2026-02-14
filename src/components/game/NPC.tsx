import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, Role } from "./GameState";
import { wallColliders } from "./House";

interface NPCProps {
  id: string;
  startPosition: [number, number, number];
  color: string;
  npcRole: "runner" | "hunter"; // opposite of player role
}

const NPC_SPEED_RUNNER = 2.8;
const NPC_SPEED_HUNTER = 3.2;
const NPC_RADIUS = 0.3;
const TAG_DISTANCE = 1.3;

function NPCFigure({ color }: { color: string }) {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.12, 0.4, 6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.08, 0.5, 0]}>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.08, 0.5, 0]}>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.06, 1.53, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.06, 1.53, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
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

export default function NPC({ id, startPosition, color, npcRole }: NPCProps) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...startPosition));
  const { tagged, tagNPC, isPlaying, escapeOpen, setCaught } = useGame();
  const wanderDir = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const wanderTimer = useRef(Math.random() * 3);
  const isTagged = tagged.has(id);

  useFrame((state, delta) => {
    if (!ref.current || !isPlaying || isTagged) return;

    const camPos = state.camera.position;
    const myPos = posRef.current;
    const toPlayer = new THREE.Vector3().subVectors(camPos, myPos);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    const speed = npcRole === "hunter" ? NPC_SPEED_HUNTER : NPC_SPEED_RUNNER;

    let moveDir = new THREE.Vector3();

    if (npcRole === "runner") {
      // Runners flee from player when close, otherwise wander
      if (dist < 8) {
        moveDir.copy(toPlayer).normalize().multiplyScalar(-1); // flee
        // Add some randomness to flee direction
        moveDir.x += (Math.random() - 0.5) * 0.3;
        moveDir.z += (Math.random() - 0.5) * 0.3;
        moveDir.normalize();
      } else {
        // Wander
        wanderTimer.current -= delta;
        if (wanderTimer.current <= 0) {
          wanderDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          wanderTimer.current = 2 + Math.random() * 3;
        }
        moveDir.copy(wanderDir.current);
      }
    } else {
      // Hunters chase the player
      if (dist > 1) {
        moveDir.copy(toPlayer).normalize();
      }
    }

    if (moveDir.length() > 0) {
      moveDir.normalize();
      const newPos = myPos.clone().add(moveDir.multiplyScalar(speed * delta));

      // Keep in bounds
      newPos.x = THREE.MathUtils.clamp(newPos.x, -13.5, 13.5);
      newPos.z = THREE.MathUtils.clamp(newPos.z, -23.5, 14.5);

      if (!checkCollision(newPos)) {
        myPos.copy(newPos);
      } else {
        // Try perpendicular directions
        const perp1 = new THREE.Vector3(-moveDir.z, 0, moveDir.x);
        const alt1 = myPos.clone().add(perp1.multiplyScalar(speed * delta));
        if (!checkCollision(alt1)) {
          myPos.copy(alt1);
        } else {
          const perp2 = new THREE.Vector3(moveDir.z, 0, -moveDir.x);
          const alt2 = myPos.clone().add(perp2.multiplyScalar(speed * delta));
          if (!checkCollision(alt2)) {
            myPos.copy(alt2);
          }
        }
      }
    }

    ref.current.position.copy(myPos);

    // Face movement direction
    if (moveDir.length() > 0.1) {
      const targetRot = Math.atan2(moveDir.x, moveDir.z);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot, 0.1);
    }

    // Leg animation (simple bob)
    const t = state.clock.elapsedTime;
    if (moveDir.length() > 0.1) {
      ref.current.position.y = Math.abs(Math.sin(t * 10)) * 0.05;
    }

    // Check tagging - player is hunter, tag runners
    if (npcRole === "runner" && dist < TAG_DISTANCE) {
      tagNPC(id);
    }

    // Hunters catch the player (runner)
    if (npcRole === "hunter" && dist < TAG_DISTANCE) {
      setCaught();
    }
  });

  if (isTagged) return null;

  return (
    <group ref={ref} position={startPosition}>
      <NPCFigure color={color} />
      {/* Indicator glow */}
      <pointLight
        color={npcRole === "hunter" ? "#ff0000" : "#00aaff"}
        intensity={1}
        distance={3}
        position={[0, 2, 0]}
      />
    </group>
  );
}

// NPC spawn positions - scattered across the expanded map
export const RUNNER_NPCS: Omit<NPCProps, "npcRole">[] = [
  { id: "runner_1", startPosition: [-8, 0, -10], color: "#4ecdc4" },
  { id: "runner_2", startPosition: [8, 0, -14], color: "#feca57" },
  { id: "runner_3", startPosition: [-10, 0, -18], color: "#ff9ff3" },
  { id: "runner_4", startPosition: [10, 0, -8], color: "#a8e6cf" },
  { id: "runner_5", startPosition: [0, 0, 12], color: "#c792ea" },
];

export const HUNTER_NPCS: Omit<NPCProps, "npcRole">[] = [
  { id: "hunter_1", startPosition: [-10, 0, -15], color: "#ff4444" },
  { id: "hunter_2", startPosition: [10, 0, -12], color: "#ff6644" },
  { id: "hunter_3", startPosition: [0, 0, -20], color: "#ff2222" },
  { id: "hunter_4", startPosition: [-5, 0, 10], color: "#cc3333" },
  { id: "hunter_5", startPosition: [8, 0, 8], color: "#ee5555" },
];
