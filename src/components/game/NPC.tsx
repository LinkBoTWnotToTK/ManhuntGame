import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, MAP_BOUNDS, GameMap, DIFFICULTY_SETTINGS } from "./GameState";
import { wallColliders } from "./House";
import { playerPosition, npcPositions, projectiles, addProjectile } from "./SharedState";

interface NPCProps {
  id: string;
  startPosition: [number, number, number];
  color: string;
  npcRole: "runner" | "hunter" | "ally";
}

const RUNNER_BASE_SPEED = 3.8;
const RUNNER_SPRINT_SPEED = 5.2;
const HUNTER_BASE_SPEED = 2.4;
const HUNTER_SPRINT_SPEED = 3.5;
const HUNTER_HESITATION_CHANCE = 0.3;
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
        <sphereGeometry args={[isHunter ? 0.19 : 0.16, 8, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 1.63, 0.13]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={isHunter ? 2 : 0.5} />
      </mesh>
      <mesh position={[-0.05, 1.63, 0.13]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={isHunter ? 2 : 0.5} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[isHunter ? 0.17 : 0.14, isHunter ? 0.48 : 0.4, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.24, 1.1, 0]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.05, 0.35, 3, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 1.1, 0]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.05, 0.35, 3, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[-0.09, 0.5, 0]}>
        <capsuleGeometry args={[0.06, 0.45, 3, 6]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.09, 0.5, 0]}>
        <capsuleGeometry args={[0.06, 0.45, 3, 6]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const pct = health / maxHealth;
  const color = pct > 0.6 ? "#33ff33" : pct > 0.3 ? "#ffaa00" : "#ff3333";
  return (
    <group position={[0, 2.1, 0]}>
      <mesh><planeGeometry args={[0.6, 0.08]} /><meshBasicMaterial color="#222222" transparent opacity={0.7} side={THREE.DoubleSide} /></mesh>
      <mesh position={[-(1 - pct) * 0.3, 0, 0.001]}>
        <planeGeometry args={[0.6 * pct, 0.08]} /><meshBasicMaterial color={color} side={THREE.DoubleSide} />
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
  const { tagged, tagNPC, isPlaying, damagePlayer, damageNPC, npcHealth, selectedMap, role: playerRole, difficulty, gameMode } = useGame();
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
  const diffSettings = DIFFICULTY_SETTINGS[difficulty];
  const hunterSpeedMult = diffSettings.hunterSpeedMult;
  const hunterChaseRange = diffSettings.hunterChaseRange;

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
    } else { stuckTimer.current = 0; }
    lastPos.current.copy(myPos);

    if (npcRole === "ally") {
      // Ally AI: chase enemy runners (or enemy hunters depending on player role)
      let nearestDist = Infinity;
      let nearestPos: THREE.Vector3 | null = null;
      let nearestId: string | null = null;
      
      // If player is hunter, allies chase runners. If player is runner, allies chase hunters.
      const targetPrefix = playerRole === "hunter" ? "r" : "h";
      
      for (const [nid, npos] of npcPositions) {
        if (!nid.startsWith(targetPrefix) || tagged.has(nid)) continue;
        const d = myPos.distanceTo(npos);
        if (d < nearestDist) { nearestDist = d; nearestPos = npos; nearestId = nid; }
      }
      if (nearestPos) {
        moveDir.subVectors(nearestPos, myPos); moveDir.y = 0;
        const flankPerp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
        moveDir.normalize().addScaledVector(flankPerp, Math.sin(t * 2) * 0.4);
        moveDir.normalize();
        speed = nearestDist < 5 ? HUNTER_SPRINT_SPEED : HUNTER_BASE_SPEED;
        if (nearestDist < TAG_DISTANCE && nearestId) {
          damageNPC(nearestId, 1);
        }
      } else {
        // Follow player loosely
        const toPlayer = new THREE.Vector3().subVectors(playerPosition, myPos);
        toPlayer.y = 0;
        const playerDist = toPlayer.length();
        if (playerDist > 8) {
          moveDir.copy(toPlayer).normalize();
          speed = HUNTER_SPRINT_SPEED;
        } else {
          wanderTimer.current -= delta;
          if (wanderTimer.current <= 0) {
            wanderDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            wanderTimer.current = 3 + Math.random() * 3;
          }
          moveDir.copy(wanderDir.current);
          speed = HUNTER_BASE_SPEED * 0.5;
        }
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
          if (jukeTimer.current <= 0) { jukeDir.current = Math.random() > 0.5 ? 1 : -1; jukeTimer.current = 0.3 + Math.random() * 0.6; }
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
              THREE.MathUtils.clamp(tx, bounds.minX + 3, bounds.maxX - 3) - myPos.x, 0,
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
            sd.x += (Math.random() - 0.5) * 0.2; sd.z += (Math.random() - 0.5) * 0.2; sd.normalize();
            addProjectile(myPos.clone().add(new THREE.Vector3(0, 1.2, 0)), sd, id);
            ammo.current--;
            shootTimer.current = 3 + Math.random() * 2;
          }
        }
      } else {
        // HUNTER AI
        const isSprinting = dist < 6;
        speed = (isSprinting ? HUNTER_SPRINT_SPEED : HUNTER_BASE_SPEED) * hunterSpeedMult;

        if (dist < hunterChaseRange) {
          if (Math.random() < HUNTER_HESITATION_CHANCE * delta) speed *= 0.3;
          moveDir.copy(toPlayer).normalize();
          const flankPerp = new THREE.Vector3(-moveDir.z, 0, moveDir.x).normalize();
          moveDir.addScaledVector(flankPerp, Math.sin(t * 1.5 + flankAngle.current * 5) * 0.55);
          moveDir.normalize();
          if (dist > 5 && dist < 10) {
            const prediction = playerPosition.clone().addScaledVector(toPlayer.clone().normalize().multiplyScalar(-1), -0.5);
            const toPrediction = new THREE.Vector3().subVectors(prediction, myPos).normalize();
            moveDir.lerp(toPrediction, 0.08);
            moveDir.normalize();
          }
        } else if (dist < hunterChaseRange + 7) {
          wanderTimer.current -= delta;
          if (wanderTimer.current <= 0) {
            wanderDir.current.set(
              playerPosition.x + (Math.random() - 0.5) * 25 - myPos.x, 0,
              playerPosition.z + (Math.random() - 0.5) * 25 - myPos.z
            ).normalize();
            wanderTimer.current = 3 + Math.random() * 4;
          }
          moveDir.copy(wanderDir.current);
          speed = HUNTER_BASE_SPEED * 0.5 * hunterSpeedMult;
        } else {
          wanderTimer.current -= delta;
          if (wanderTimer.current <= 0) {
            const rx = bounds.minX + 5 + Math.random() * (bounds.maxX - bounds.minX - 10);
            const rz = bounds.minZ + 5 + Math.random() * (bounds.maxZ - bounds.minZ - 10);
            wanderDir.current.set(rx - myPos.x, 0, rz - myPos.z).normalize();
            wanderTimer.current = 4 + Math.random() * 5;
          }
          moveDir.copy(wanderDir.current);
          speed = HUNTER_BASE_SPEED * 0.4 * hunterSpeedMult;
        }
      }

      const distToPlayer = myPos.distanceTo(playerPosition);
      if (npcRole === "runner" && distToPlayer < TAG_DISTANCE) tagNPC(id);
      if (npcRole === "hunter" && distToPlayer < TAG_DISTANCE) {
        // Block Hunt: 2 hearts damage via GameState handler
        const dmg = gameMode === "blockhunt" ? 2 : 3;
        damagePlayer(dmg);
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
    } else { ref.current.position.y = 0; }

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
      <group ref={healthBarRef}><HealthBar health={health} maxHealth={3} /></group>
    </group>
  );
}

// NPC spawn positions per map — more allies for team modes
function getSpawnPositions(map: GameMap) {
  const allHunters = [
    { id: "h1", color: "#ff3333" },
    { id: "h2", color: "#ff5533" },
    { id: "h3", color: "#cc2222" },
    { id: "h4", color: "#ff4444" },
    { id: "h5", color: "#dd3311" },
    { id: "h6", color: "#ee2244" },
    { id: "h7", color: "#ff1155" },
  ];

  const mapPositions: Record<GameMap, { hunterPos: [number,number,number][]; runnerPos: { pos: [number,number,number]; color: string }[] }> = {
    suburban: {
      hunterPos: [[-24,0,-30],[24,0,-28],[0,0,-48],[-15,0,-8],[20,0,12],[-10,0,20],[15,0,-40]],
      runnerPos: [
        { pos: [-26,0,-25], color: "#4ecdc4" }, { pos: [26,0,-30], color: "#feca57" },
        { pos: [-30,0,-48], color: "#ff9ff3" }, { pos: [28,0,-15], color: "#a8e6cf" },
        { pos: [0,0,22], color: "#c792ea" }, { pos: [-22,0,15], color: "#48dbfb" },
        { pos: [18,0,-48], color: "#f8b500" },
      ],
    },
    industrial: {
      hunterPos: [[-30,0,-30],[30,0,-28],[0,0,-50],[-20,0,-10],[20,0,15],[-15,0,20],[25,0,-45]],
      runnerPos: [
        { pos: [-30,0,-25], color: "#4ecdc4" }, { pos: [30,0,-30], color: "#feca57" },
        { pos: [-33,0,-50], color: "#ff9ff3" }, { pos: [33,0,-15], color: "#a8e6cf" },
        { pos: [0,0,22], color: "#c792ea" }, { pos: [-25,0,15], color: "#48dbfb" },
        { pos: [20,0,-50], color: "#f8b500" },
      ],
    },
    forest: {
      hunterPos: [[-32,0,-35],[32,0,-32],[0,0,-55],[-25,0,-10],[25,0,10],[-18,0,25],[30,0,-50]],
      runnerPos: [
        { pos: [-35,0,-25], color: "#4ecdc4" }, { pos: [35,0,-35], color: "#feca57" },
        { pos: [-40,0,-55], color: "#ff9ff3" }, { pos: [38,0,-18], color: "#a8e6cf" },
        { pos: [0,0,28], color: "#c792ea" }, { pos: [-30,0,20], color: "#48dbfb" },
        { pos: [25,0,-55], color: "#f8b500" },
      ],
    },
    arctic: {
      hunterPos: [[-28,0,-28],[28,0,-25],[0,0,-50],[-18,0,-8],[22,0,12],[-12,0,18],[20,0,-42]],
      runnerPos: [
        { pos: [-30,0,-25], color: "#4ecdc4" }, { pos: [30,0,-30], color: "#feca57" },
        { pos: [-33,0,-50], color: "#ff9ff3" }, { pos: [33,0,-15], color: "#a8e6cf" },
        { pos: [5,0,22], color: "#c792ea" }, { pos: [-25,0,15], color: "#48dbfb" },
        { pos: [20,0,-50], color: "#f8b500" },
      ],
    },
    underground: {
      hunterPos: [[-25,0,-25],[25,0,-22],[0,0,-45],[-15,0,-5],[18,0,8],[-10,0,15],[15,0,-38]],
      runnerPos: [
        { pos: [-25,0,-20], color: "#4ecdc4" }, { pos: [25,0,-25], color: "#feca57" },
        { pos: [-28,0,-45], color: "#ff9ff3" }, { pos: [28,0,-10], color: "#a8e6cf" },
        { pos: [0,0,18], color: "#c792ea" }, { pos: [-20,0,10], color: "#48dbfb" },
        { pos: [15,0,-45], color: "#f8b500" },
      ],
    },
    volcano: {
      hunterPos: [[-28,0,-28],[28,0,-25],[0,0,-50],[-20,0,-8],[22,0,15],[-15,0,20],[25,0,-45]],
      runnerPos: [
        { pos: [-30,0,-25], color: "#4ecdc4" }, { pos: [30,0,-30], color: "#feca57" },
        { pos: [-33,0,-50], color: "#ff9ff3" }, { pos: [33,0,-15], color: "#a8e6cf" },
        { pos: [0,0,22], color: "#c792ea" }, { pos: [-25,0,15], color: "#48dbfb" },
        { pos: [20,0,-50], color: "#f8b500" },
      ],
    },
    space_station: {
      hunterPos: [[-22,0,-22],[22,0,-20],[0,0,-42],[-15,0,-5],[18,0,8],[-10,0,15],[15,0,-35]],
      runnerPos: [
        { pos: [-25,0,-20], color: "#4ecdc4" }, { pos: [25,0,-25], color: "#feca57" },
        { pos: [-28,0,-45], color: "#ff9ff3" }, { pos: [28,0,-10], color: "#a8e6cf" },
        { pos: [0,0,18], color: "#c792ea" }, { pos: [-20,0,10], color: "#48dbfb" },
        { pos: [15,0,-45], color: "#f8b500" },
      ],
    },
    ruins: {
      hunterPos: [[-28,0,-28],[28,0,-25],[0,0,-50],[-20,0,-8],[22,0,12],[-12,0,18],[20,0,-42]],
      runnerPos: [
        { pos: [-30,0,-25], color: "#4ecdc4" }, { pos: [30,0,-30], color: "#feca57" },
        { pos: [-33,0,-50], color: "#ff9ff3" }, { pos: [33,0,-15], color: "#a8e6cf" },
        { pos: [0,0,22], color: "#c792ea" }, { pos: [-25,0,15], color: "#48dbfb" },
        { pos: [20,0,-50], color: "#f8b500" },
      ],
    },
    swamp: {
      hunterPos: [[-28,0,-28],[28,0,-25],[0,0,-50],[-20,0,-8],[22,0,12],[-12,0,18],[20,0,-42]],
      runnerPos: [
        { pos: [-30,0,-25], color: "#4ecdc4" }, { pos: [30,0,-30], color: "#feca57" },
        { pos: [-33,0,-50], color: "#ff9ff3" }, { pos: [33,0,-15], color: "#a8e6cf" },
        { pos: [0,0,22], color: "#c792ea" }, { pos: [-25,0,15], color: "#48dbfb" },
        { pos: [20,0,-50], color: "#f8b500" },
      ],
    },
    rooftop: {
      hunterPos: [[-22,0,-22],[22,0,-20],[0,0,-42],[-15,0,-5],[18,0,8],[-10,0,15],[15,0,-35]],
      runnerPos: [
        { pos: [-25,0,-20], color: "#4ecdc4" }, { pos: [25,0,-25], color: "#feca57" },
        { pos: [-28,0,-45], color: "#ff9ff3" }, { pos: [28,0,-10], color: "#a8e6cf" },
        { pos: [0,0,18], color: "#c792ea" }, { pos: [-20,0,10], color: "#48dbfb" },
        { pos: [15,0,-45], color: "#f8b500" },
      ],
    },
  };

  const mp = mapPositions[map] || mapPositions.suburban;

  return {
    runners: mp.runnerPos.map((r, i) => ({
      id: `r${i + 1}`,
      startPosition: r.pos,
      color: r.color,
    })),
    hunters: allHunters.map((h, i) => ({
      ...h,
      startPosition: mp.hunterPos[i % mp.hunterPos.length],
    })),
    // 3 ally teammates instead of 1
    allies: [
      { id: "ah1", startPosition: [3, 0, 2] as [number, number, number], color: "#ff8800" },
      { id: "ah2", startPosition: [-5, 0, 5] as [number, number, number], color: "#00ff88" },
      { id: "ah3", startPosition: [6, 0, -3] as [number, number, number], color: "#8888ff" },
    ],
  };
}

export { getSpawnPositions };
export type { NPCProps };
