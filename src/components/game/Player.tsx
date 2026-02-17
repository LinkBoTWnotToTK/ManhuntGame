import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { wallColliders } from "./House";
import { useGame, MAP_BOUNDS, ESCAPE_POSITIONS } from "./GameState";
import { playerPosition, projectiles, addProjectile } from "./SharedState";
import { ESCAPE_ZONE_RADIUS } from "./House";

const WALK_SPEED = 4.5;
const SPRINT_SPEED = 7;
const PLAYER_RADIUS = 0.3;
const STAMINA_DRAIN = 25;
const STAMINA_REGEN = 15;
const CAMERA_DIST = 6;
const CAMERA_HEIGHT = 3.5;
const HIT_RADIUS = 0.8;

function PlayerFigure({ role }: { role: string | null }) {
  const isHunter = role === "hunter";
  const bodyColor = isHunter ? "#8B4513" : "#1a3a8a";
  const skinColor = "#e8b89a";
  const accentColor = isHunter ? "#ff6600" : "#3388ff";
  const pantsColor = isHunter ? "#3a2a1a" : "#1a1a3a";
  
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.06, 1.63, 0.14]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.06, 1.63, 0.14]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Hair/hat */}
      <mesh position={[0, 1.72, -0.02]} castShadow>
        <sphereGeometry args={[0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={isHunter ? "#2a1a0a" : "#1a1a2a"} roughness={0.9} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.45, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Belt/strap */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 12]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.25, 1.1, 0]} rotation={[0, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 6, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 1.1, 0]} rotation={[0, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.05, 0.35, 6, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.32, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.32, 0.88, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Slingshot in hand */}
      <mesh position={[0.35, 0.9, 0.05]} rotation={[0.3, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.09, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 6, 10]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.09, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 6, 10]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      {/* Shoes */}
      <mesh position={[-0.09, 0.2, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
        <meshStandardMaterial color="#333" roughness={0.6} />
      </mesh>
      <mesh position={[0.09, 0.2, 0.03]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.16]} />
        <meshStandardMaterial color="#333" roughness={0.6} />
      </mesh>
      {/* Role glow */}
      <pointLight color={accentColor} intensity={0.6} distance={4} position={[0, 1.2, 0]} />
    </group>
  );
}

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const yaw = useRef(0);
  const pitch = useRef(0.4);
  const keys = useRef<Record<string, boolean>>({});
  const { camera, gl } = useThree();
  const {
    role, selectedMap, isPlaying, gameOver, escapeOpen, setEscaped,
    stamina, useStamina, regenStamina,
    playerHealth, useAmmo, damagePlayer,
    medkits, collectMedkit, healPlayer,
  } = useGame();

  const bounds = MAP_BOUNDS[selectedMap || "suburban"];
  const escapePos = ESCAPE_POSITIONS[selectedMap || "suburban"];

  const shootRef = useRef<() => void>(() => {});
  shootRef.current = () => {
    if (!isPlaying || gameOver) return;
    if (!useAmmo()) return;
    const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const spawnPos = playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(dir, 0.5);
    addProjectile(spawnPos, dir, "player");
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      yaw.current -= e.movementX * 0.003;
      pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.003, 0.1, 1.0);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!document.pointerLockElement) {
        gl.domElement.requestPointerLock();
      } else {
        shootRef.current();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (!isPlaying || gameOver) return;

    const wantsSprint = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const canSprint = stamina > 5;
    const isSprinting = wantsSprint && canSprint;
    if (isSprinting) useStamina(STAMINA_DRAIN * delta);
    else regenStamina(STAMINA_REGEN * delta);
    const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const dir = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) dir.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) dir.sub(forward);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) dir.sub(right);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) dir.add(right);

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * delta);
      const newPos = playerPosition.clone().add(dir);
      newPos.x = THREE.MathUtils.clamp(newPos.x, bounds.minX, bounds.maxX);
      newPos.z = THREE.MathUtils.clamp(newPos.z, bounds.minZ, bounds.maxZ);
      const pMin = new THREE.Vector3(newPos.x - PLAYER_RADIUS, 0, newPos.z - PLAYER_RADIUS);
      const pMax = new THREE.Vector3(newPos.x + PLAYER_RADIUS, 1.8, newPos.z + PLAYER_RADIUS);
      let blocked = false;
      for (const c of wallColliders) {
        if (pMin.x < c.max.x && pMax.x > c.min.x && pMin.y < c.max.y && pMax.y > c.min.y && pMin.z < c.max.z && pMax.z > c.min.z) {
          blocked = true; break;
        }
      }
      if (!blocked) {
        playerPosition.copy(newPos);
      } else {
        const sx = playerPosition.clone(); sx.x += dir.x;
        let bx = false;
        const sxMin = new THREE.Vector3(sx.x - PLAYER_RADIUS, 0, sx.z - PLAYER_RADIUS);
        const sxMax = new THREE.Vector3(sx.x + PLAYER_RADIUS, 1.8, sx.z + PLAYER_RADIUS);
        for (const c of wallColliders) {
          if (sxMin.x < c.max.x && sxMax.x > c.min.x && sxMin.y < c.max.y && sxMax.y > c.min.y && sxMin.z < c.max.z && sxMax.z > c.min.z) { bx = true; break; }
        }
        if (!bx) playerPosition.x = sx.x;
        const sz = playerPosition.clone(); sz.z += dir.z;
        let bz = false;
        const szMin = new THREE.Vector3(sz.x - PLAYER_RADIUS, 0, sz.z - PLAYER_RADIUS);
        const szMax = new THREE.Vector3(sz.x + PLAYER_RADIUS, 1.8, sz.z + PLAYER_RADIUS);
        for (const c of wallColliders) {
          if (szMin.x < c.max.x && szMax.x > c.min.x && szMin.y < c.max.y && szMax.y > c.min.y && szMin.z < c.max.z && szMax.z > c.min.z) { bz = true; break; }
        }
        if (!bz) playerPosition.z = sz.z;
      }
      if (meshRef.current) {
        const t = state.clock.elapsedTime;
        meshRef.current.position.y = Math.abs(Math.sin(t * (isSprinting ? 14 : 8))) * 0.06;
      }
    }

    if (meshRef.current) {
      meshRef.current.position.x = playerPosition.x;
      meshRef.current.position.z = playerPosition.z;
      meshRef.current.rotation.y = yaw.current + Math.PI;
    }

    // Third-person camera — smooth follow
    const camOffset = new THREE.Vector3(
      Math.sin(yaw.current) * CAMERA_DIST,
      CAMERA_HEIGHT * pitch.current + 2,
      Math.cos(yaw.current) * CAMERA_DIST
    );
    const targetCamPos = playerPosition.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.1);
    camera.lookAt(playerPosition.x, 1.3, playerPosition.z);

    // Escape zone check
    if (role === "runner" && escapeOpen) {
      const dx = playerPosition.x - escapePos[0];
      const dz = playerPosition.z - escapePos[2];
      if (Math.sqrt(dx * dx + dz * dz) < ESCAPE_ZONE_RADIUS) setEscaped();
    }

    // Medkit collection
    for (const med of medkits) {
      const dx = playerPosition.x - med.position[0];
      const dz = playerPosition.z - med.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < 1.5 && playerHealth < 3) {
        healPlayer();
        collectMedkit(med.id);
        break;
      }
    }

    // Check NPC projectiles hitting player
    for (const p of projectiles) {
      if (!p.alive || p.owner === "player") continue;
      const dx = p.position.x - playerPosition.x;
      const dy = p.position.y - 1.0;
      const dz = p.position.z - playerPosition.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < HIT_RADIUS) {
        p.alive = false;
        damagePlayer(1);
        break;
      }
    }
  });

  return (
    <group ref={meshRef} position={[playerPosition.x, 0, playerPosition.z]}>
      <PlayerFigure role={role} />
    </group>
  );
}
