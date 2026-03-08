import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, MAP_BOUNDS, GameMap } from "./GameState";
import { wallColliders } from "./House";
import { playerPosition, npcPositions, projectiles, addProjectile } from "./SharedState";

interface NPCProps {
  id: string;
  startPosition: [number, number, number];
  color: string;
  npcRole: "runner" | "hunter" | "ally";
}

// NPC speeds — hunters slowed to reduce aggressive homing
const RUNNER_BASE_SPEED = 3.8;
const RUNNER_SPRINT_SPEED = 5.2;
const HUNTER_BASE_SPEED = 2.4;
const HUNTER_SPRINT_SPEED = 3.5;
const HUNTER_HESITATION_CHANCE = 0.3; // chance to pause briefly
const NPC_RADIUS = 0.3;
const TAG_DISTANCE = 1.2;
const HIT_RADIUS = 0.8;

function NPCFigure({ color, npcRole }: { color: string; npcRole: string }) {
  const isHunter = npcRole === "hunter" || npcRole === "ally";
  const bodyColor = isHunter ? "#4a1a0a" : color;
  const skinColor = "#d4a574";
  const eyeColor = npcRole === "ally" ? "#00ff88" : isHunter ? "#ff2200" : "#ffffff";
  const pantsColor = isHunter ? "#2a1a0a" : "#1a1a3a";
  
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[isHunter ? 0.19 : 0.16, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 1.63, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={isHunter ? 2 : 0.5} />
      </mesh>
      <mesh position={[-0.05, 1.63, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={isHunter ? 2 : 0.5} />
      </mesh>
      <mesh position={[0, 1.72, -0.02]} castShadow>
        <sphereGeometry args={[isHunter ? 0.2 : 0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={isHunter ? "#1a0a0a" : "#2a2a3a"} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[isHunter ? 0.17 : 0.14, isHunter ? 0.48 : 0.4, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[isHunter ? 0.18 : 0.15, isHunter ? 0.18 : 0.15, 0.06, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[-0.24, 1.1, 0]} rotation={[0, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 6, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 1.1, 0]} rotation={[0, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 6, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.3, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.3, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {!isHunter && (
        <mesh position={[0.33, 0.9, 0.05]} rotation={[0.3, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.25, 6]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
        </mesh>
      )}
      <mesh position={[-0.09, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 6, 10]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.09, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 6, 10]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.09, 0.2, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>
      <mesh position={[0.09, 0.2, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>
    </group>
  );
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const pct = health / maxHealth;
  const color = pct > 0.6 ? "#33ff33" : pct > 0.3 ? "#ffaa00" : "#ff3333";
  return (
    <group position={[0, 2.1, 0]}>
      <mesh>
        <planeGeometry args={[0.6, 0.08]} />
        <meshBasicMaterial color="#222222" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(1 - pct) * 0.3, 0, 0.001]}>
        <planeGeometry args={[0.6 * pct, 0.08]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function checkCollision(pos: THREE.Vector3): boolean {
  const pMin = new THREE.Vector3(pos.x - NPC_RADIUS, 0, pos.z - NPC_RADIUS);
  const pMax = new THREE.Vector3(pos.x + NPC_RADIUS, 2, pos.z + NPC_RADIUS);
  for (const c of wallColliders) {
    if (pMin.x < c.max.x && pMax.x > c.min.x && pMin.y < c.max.y && pMax.y > c.min.y && pMin.z < c.max.z && pMax.z > c.min.z) return true;
  }
  return false;
}

function tryMove(myPos: THREE.Vector3, moveDir: THREE.Vector3, speed: number, delta: number, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean {
  const newPos = myPos.clone().addScaledVector(moveDir.clone().normalize(), speed * delta);
  newPos.x = THREE.MathUtils.clamp(newPos.x, bounds.minX, bounds.maxX);
  newPos.z = THREE.MathUtils.clamp(newPos.z, bounds.minZ, bounds.maxZ);
  if (!checkCollision(newPos)) { myPos.copy(newPos); return true; }
  const sx = myPos.clone(); sx.x += moveDir.x * speed * delta;
  if (!checkCollision(sx)) { myPos.x = sx.x; return true; }
  const sz = myPos.clone(); sz.z += moveDir.z * speed * delta;
  if (!checkCollision(sz)) { myPos.z = sz.z; return true; }
  const perp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
  const altPos = myPos.clone().addScaledVector(perp, speed * delta);
  if (!checkCollision(altPos)) { myPos.copy(altPos); return true; }
  return false;
}

export default function NPC({ id, startPosition, color, npcRole }: NPCProps) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...startPosition));
  const { tagged, tagNPC, isPlaying, damagePlayer, damageNPC, npcHealth, selectedMap, role: playerRole } = useGame();
  const wanderDir = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const wanderTimer = useRef(Math.random() * 2);
  const jukeTimer = useRef(0);
  const jukeDir = useRef(1);
  const lastMoveDir = useRef(new THREE.Vector3());
  const shootTimer = useRef(2 + Math.random() * 3);
  const ammo = useRef(npcRole === "runner" ? 3 : 0);
  const healthBarRef = useRef<THREE.Group>(null);
  const flankAngle = useRef((Math.random() - 0.5) * 1.2);
  const stuckTimer = useRef(0);
  const lastPos = useRef(new THREE.Vector3(...startPosition));

  const bounds = MAP_BOUNDS[selectedMap || "suburban"];
  const isTagged = tagged.has(id);
  const health = npcHealth[id] ?? 3;

  useFrame((state, delta) => {
    if (!ref.current || !isPlaying || isTagged) return;
    if (health <= 0) { tagNPC(id); return; }

    npcPositions.set(id, posRef.current.clone());

    const myPos = posRef.current;
    const t = state.clock.elapsedTime;
    let moveDir = new THREE.Vector3();
    let speed: number;

    const distMoved = myPos.distanceTo(lastPos.current);
    if (distMoved < 0.05 * delta) {
      stuckTimer.current += delta;
      if (stuckTimer.current > 0.5) {
        wanderDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        stuckTimer.current = 0;
      }
    } else {
      stuckTimer.current = 0;
    }
    lastPos.current.copy(myPos);

    if (npcRole === "ally") {
      let nearestDist = Infinity;
      let nearestPos: THREE.Vector3 | null = null;
      let nearestId: string | null = null;
      for (const [nid, npos] of npcPositions) {
        if (!nid.startsWith("r") || tagged.has(nid)) continue;
        const d = myPos.distanceTo(npos);
        if (d < nearestDist) { nearestDist = d; nearestPos = npos; nearestId = nid; }
      }
      if (nearestPos) {
        moveDir.subVectors(nearestPos, myPos); moveDir.y = 0;
        const flankPerp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
        moveDir.normalize().addScaledVector(flankPerp, Math.sin(t * 2) * 0.4);
        moveDir.normalize();
        speed = nearestDist < 5 ? HUNTER_SPRINT_SPEED : HUNTER_BASE_SPEED;
        if (nearestDist < TAG_DISTANCE && nearestId) tagNPC(nearestId);
      } else {
        wanderTimer.current -= delta;
        if (wanderTimer.current <= 0) {
          wanderDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          wanderTimer.current = 3 + Math.random() * 3;
        }
        moveDir.copy(wanderDir.current);
        speed = HUNTER_BASE_SPEED * 0.5;
      }
    } else {
      const toPlayer = new THREE.Vector3().subVectors(playerPosition, myPos);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (npcRole === "runner") {
        const fleeRange = 12;
        const panicRange = 5;
        const isSprinting = dist < panicRange;
        speed = isSprinting ? RUNNER_SPRINT_SPEED : RUNNER_BASE_SPEED;

        if (dist < fleeRange) {
          moveDir.copy(toPlayer).normalize().multiplyScalar(-1);
          
          for (const [nid, npos] of npcPositions) {
            if (!nid.startsWith("ah")) continue;
            const allyDist = myPos.distanceTo(npos);
            if (allyDist < 10) {
              const fleeAlly = new THREE.Vector3().subVectors(myPos, npos).normalize();
              moveDir.add(fleeAlly.multiplyScalar(8 / Math.max(allyDist, 1)));
            }
          }
          
          jukeTimer.current -= delta;
          if (jukeTimer.current <= 0) {
            jukeDir.current = Math.random() > 0.5 ? 1 : -1;
            jukeTimer.current = 0.3 + Math.random() * 0.6;
          }
          const jukeFactor = dist < panicRange ? 0.9 : 0.4;
          const perp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).multiplyScalar(jukeDir.current * jukeFactor);
          moveDir.add(perp).normalize();
          
          if (Math.abs(myPos.x) > bounds.maxX - 5) moveDir.x -= Math.sign(myPos.x) * 0.8;
          if (myPos.z > bounds.maxZ - 5 || myPos.z < bounds.minZ + 5) moveDir.z -= Math.sign(myPos.z) * 0.8;
          moveDir.normalize();
        } else {
          wanderTimer.current -= delta;
          if (wanderTimer.current <= 0) {
            const awayFromPlayer = new THREE.Vector3().subVectors(myPos, playerPosition).normalize();
            const tx = myPos.x + awayFromPlayer.x * 15 + (Math.random() - 0.5) * 20;
            const tz = myPos.z + awayFromPlayer.z * 15 + (Math.random() - 0.5) * 20;
            wanderDir.current.set(
              THREE.MathUtils.clamp(tx, bounds.minX + 3, bounds.maxX - 3) - myPos.x,
              0,
              THREE.MathUtils.clamp(tz, bounds.minZ + 3, bounds.maxZ - 3) - myPos.z
            ).normalize();
            wanderTimer.current = 2 + Math.random() * 3;
          }
          moveDir.copy(wanderDir.current);
          speed = RUNNER_BASE_SPEED * 0.7;
        }

        if (ammo.current > 0 && dist < 10) {
          shootTimer.current -= delta;
          if (shootTimer.current <= 0) {
            const sd = toPlayer.clone().normalize();
            sd.x += (Math.random() - 0.5) * 0.2;
            sd.z += (Math.random() - 0.5) * 0.2;
            sd.normalize();
            addProjectile(myPos.clone().add(new THREE.Vector3(0, 1.2, 0)), sd, id);
            ammo.current--;
            shootTimer.current = 3 + Math.random() * 2;
          }
        }
      } else {
        // HUNTER AI
        const chaseRange = 20;
        const isSprinting = dist < 8;
        speed = isSprinting ? HUNTER_SPRINT_SPEED : HUNTER_BASE_SPEED;

        if (dist < chaseRange) {
          moveDir.copy(toPlayer).normalize();
          const flankPerp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
          moveDir.addScaledVector(flankPerp, Math.sin(t * 2 + flankAngle.current * 5) * 0.35);
          moveDir.normalize();
          
          if (dist > 3) {
            const prediction = playerPosition.clone().addScaledVector(toPlayer.clone().normalize().multiplyScalar(-1), -1);
            const toPrediction = new THREE.Vector3().subVectors(prediction, myPos).normalize();
            moveDir.lerp(toPrediction, 0.15);
            moveDir.normalize();
          }
        } else {
          wanderTimer.current -= delta;
          if (wanderTimer.current <= 0) {
            wanderDir.current.set(
              playerPosition.x + (Math.random() - 0.5) * 15 - myPos.x, 0,
              playerPosition.z + (Math.random() - 0.5) * 15 - myPos.z
            ).normalize();
            wanderTimer.current = 1.5 + Math.random() * 2;
          }
          moveDir.copy(wanderDir.current);
          speed = HUNTER_BASE_SPEED * 0.6;
        }
      }

      const distToPlayer = myPos.distanceTo(playerPosition);
      if (npcRole === "runner" && distToPlayer < TAG_DISTANCE) {
        tagNPC(id);
      }
      if (npcRole === "hunter" && distToPlayer < TAG_DISTANCE) {
        damagePlayer(3);
      }
    }

    if (moveDir.lengthSq() > 0) {
      tryMove(myPos, moveDir, speed, delta, bounds);
      lastMoveDir.current.copy(moveDir);
    }

    ref.current.position.copy(myPos);
    if (lastMoveDir.current.lengthSq() > 0.01) {
      const targetRot = Math.atan2(lastMoveDir.current.x, lastMoveDir.current.z);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot, 0.12);
    }
    if (moveDir.lengthSq() > 0.01) {
      const runSpeed = speed > 3 ? 14 : 8;
      ref.current.position.y = Math.abs(Math.sin(t * runSpeed)) * 0.06;
    } else {
      ref.current.position.y = 0;
    }

    if (playerRole === "runner") {
      for (const p of projectiles) {
        if (!p.alive || p.owner !== "player") continue;
        const dx = p.position.x - myPos.x;
        const dy = p.position.y - 1.0;
        const dz = p.position.z - myPos.z;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < HIT_RADIUS) {
          p.alive = false;
          damageNPC(id, 1);
          break;
        }
      }
    }

    if (healthBarRef.current) healthBarRef.current.lookAt(state.camera.position);
  });

  if (isTagged || health <= 0) return null;

  return (
    <group ref={ref} position={startPosition}>
      <NPCFigure color={color} npcRole={npcRole} />
      <group ref={healthBarRef}>
        <HealthBar health={health} maxHealth={3} />
      </group>
      <pointLight
        color={npcRole === "hunter" ? "#ff2200" : npcRole === "ally" ? "#00ff88" : "#00ccff"}
        intensity={npcRole === "hunter" ? 1.5 : 0.8}
        distance={npcRole === "hunter" ? 5 : 3}
        position={[0, 2, 0]}
      />
    </group>
  );
}

// NPC spawn positions per map — now with 5 hunters for runner mode
function getSpawnPositions(map: GameMap) {
  switch (map) {
    case "industrial":
      return {
        runners: [
          { id: "r1", startPosition: [-30, 0, -25] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [30, 0, -30] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-33, 0, -50] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [33, 0, -15] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 22] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-25, 0, 15] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [20, 0, -50] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-30, 0, -30] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [30, 0, -28] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -50] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-20, 0, -10] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [20, 0, 15] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    case "forest":
      return {
        runners: [
          { id: "r1", startPosition: [-35, 0, -25] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [35, 0, -35] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-40, 0, -55] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [38, 0, -18] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 28] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-30, 0, 20] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [25, 0, -55] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-32, 0, -35] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [32, 0, -32] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -55] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-25, 0, -10] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [25, 0, 10] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    case "arctic":
      return {
        runners: [
          { id: "r1", startPosition: [-30, 0, -25] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [30, 0, -30] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-33, 0, -50] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [33, 0, -15] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [5, 0, 22] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-25, 0, 15] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [20, 0, -50] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-28, 0, -28] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [28, 0, -25] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -50] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-18, 0, -8] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [22, 0, 12] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    case "underground":
      return {
        runners: [
          { id: "r1", startPosition: [-25, 0, -20] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [25, 0, -25] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-28, 0, -45] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [28, 0, -10] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 18] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-20, 0, 10] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [15, 0, -45] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-25, 0, -25] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [25, 0, -22] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -45] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-15, 0, -5] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [18, 0, 8] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    case "volcano":
      return {
        runners: [
          { id: "r1", startPosition: [-30, 0, -25] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [30, 0, -30] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-33, 0, -50] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [33, 0, -15] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 22] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-25, 0, 15] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [20, 0, -50] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-28, 0, -28] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [28, 0, -25] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -50] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-20, 0, -8] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [22, 0, 15] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    case "space_station":
      return {
        runners: [
          { id: "r1", startPosition: [-25, 0, -20] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [25, 0, -25] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-28, 0, -45] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [28, 0, -10] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 18] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-20, 0, 10] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [15, 0, -45] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-22, 0, -22] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [22, 0, -20] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -42] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-15, 0, -5] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [18, 0, 8] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
    default: // suburban
      return {
        runners: [
          { id: "r1", startPosition: [-26, 0, -25] as [number,number,number], color: "#4ecdc4" },
          { id: "r2", startPosition: [26, 0, -30] as [number,number,number], color: "#feca57" },
          { id: "r3", startPosition: [-30, 0, -48] as [number,number,number], color: "#ff9ff3" },
          { id: "r4", startPosition: [28, 0, -15] as [number,number,number], color: "#a8e6cf" },
          { id: "r5", startPosition: [0, 0, 22] as [number,number,number], color: "#c792ea" },
          { id: "r6", startPosition: [-22, 0, 15] as [number,number,number], color: "#48dbfb" },
          { id: "r7", startPosition: [18, 0, -48] as [number,number,number], color: "#f8b500" },
        ],
        hunters: [
          { id: "h1", startPosition: [-24, 0, -30] as [number,number,number], color: "#ff3333" },
          { id: "h2", startPosition: [24, 0, -28] as [number,number,number], color: "#ff5533" },
          { id: "h3", startPosition: [0, 0, -48] as [number,number,number], color: "#cc2222" },
          { id: "h4", startPosition: [-15, 0, -8] as [number,number,number], color: "#ff4444" },
          { id: "h5", startPosition: [20, 0, 12] as [number,number,number], color: "#dd3311" },
        ],
        allies: [
          { id: "ah1", startPosition: [3, 0, 2] as [number,number,number], color: "#ff8800" },
        ],
      };
  }
}

export { getSpawnPositions };
export type { NPCProps };
