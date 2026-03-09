import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { wallColliders } from "./House";
import { useGame, MAP_BOUNDS, ESCAPE_POSITIONS } from "./GameState";
import { playerPosition, projectiles, addProjectile, npcPositions, playerY, playerVelocityY, setPlayerY, setPlayerVelocityY, platformColliders, disguisedAs, setDisguise, mobileJoystick, mobileCameraDelta, mobileButtons } from "./SharedState";
import { windForce } from "./WeatherSystem";
import { ESCAPE_ZONE_RADIUS } from "./House";
import { WEAPONS, throwRock, throwableRocks } from "./WeaponSystem";
import type { WeaponType } from "./WeaponSystem";

const BASE_WALK_SPEED = 4.5;
const BASE_SPRINT_SPEED = 7;
const PLAYER_RADIUS = 0.3;
const BASE_STAMINA_DRAIN = 25;
const STAMINA_REGEN = 15;
const CAMERA_DIST = 5;
const CAMERA_HEIGHT = 3;
const HIT_RADIUS = 0.8;
const GRAVITY = -20;
const JUMP_VELOCITY = 8;
const DOUBLE_JUMP_VELOCITY = 7;
const WALL_RUN_SPEED = 5;
const WALL_RUN_DURATION = 0.8; // seconds
const WALL_CHECK_DIST = 0.6;

function PlayerFigure({ role, isDisguised }: { role: string | null; isDisguised: boolean }) {
  if (isDisguised) {
    return (
      <group>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  const isHunter = role === "hunter";
  const bodyColor = isHunter ? "#8B4513" : "#1a3a8a";
  const skinColor = "#e8b89a";
  const pantsColor = isHunter ? "#3a2a1a" : "#1a1a3a";
  
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.06, 1.63, 0.14]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[-0.06, 1.63, 0.14]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.45, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.25, 1.1, 0]} rotation={[0, 0, 0.25]}>
        <capsuleGeometry args={[0.05, 0.35, 3, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 1.1, 0]} rotation={[0, 0, -0.25]}>
        <capsuleGeometry args={[0.05, 0.35, 3, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </mesh>
      {/* Legs */}
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

// Get ground height at a position (checks platforms)
function getGroundHeight(x: number, z: number, currentY: number): number {
  let groundY = 0; // base ground
  for (const plat of platformColliders) {
    if (x >= plat.min.x && x <= plat.max.x && z >= plat.min.z && z <= plat.max.z) {
      // Only count if we're above or near the platform top
      if (currentY >= plat.max.y - 0.3) {
        groundY = Math.max(groundY, plat.max.y);
      }
    }
  }
  return groundY;
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
    playerHealth, useAmmo, damagePlayer, damageNPC,
    medkits, collectMedkit, healPlayer,
    ammoPickups, collectAmmo,
    coinPickups, collectCoin,
    speedMultiplier, staminaDrainMultiplier, maxHealth,
    currentWeapon, meleeCooldown, setMeleeCooldown, switchWeapon,
    npcHealth, tagged,
    gameMode, kothZone, addKothScore, checkpoints, checkpointIndex, advanceCheckpoint,
    flagPosition, flagCarried, grabFlag, returnFlag, basePosition,
    isDisguised, toggleDisguise,
  } = useGame();

  const bounds = MAP_BOUNDS[selectedMap || "suburban"];
  const escapePos = ESCAPE_POSITIONS[selectedMap || "suburban"];
  const weaponCooldownRef = useRef(0);
  const meleeCooldownRef = useRef(0);
  const isGrounded = useRef(true);
  const jumpBuffered = useRef(false);
  const doubleJumpUsed = useRef(false);
  const wallRunTimer = useRef(0);
  const wallRunSide = useRef(0); // -1 left, 1 right, 0 none
  const isWallRunning = useRef(false);

  const shootRef = useRef<() => void>(() => {});
  shootRef.current = () => {
    if (!isPlaying || gameOver) return;
    if (weaponCooldownRef.current > 0) return;

    if (role === "hunter") {
      if (meleeCooldownRef.current > 0) return;
      meleeCooldownRef.current = 0.6;
      setMeleeCooldown(0.6);
      for (const [nid, npos] of npcPositions) {
        if (tagged.has(nid)) continue;
        const dist = playerPosition.distanceTo(npos);
        if (dist < 2.0) {
          const toNpc = new THREE.Vector3().subVectors(npos, playerPosition).normalize();
          const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
          const dot = toNpc.dot(forward);
          if (dot > 0.3) {
            damageNPC(nid, 1);
          }
        }
      }
      return;
    }

    const weapon = WEAPONS[currentWeapon];
    if (!weapon) return;
    let ammoNeeded = weapon.ammoPerShot;
    let ammoOk = true;
    for (let i = 0; i < ammoNeeded; i++) {
      if (!useAmmo()) { ammoOk = false; break; }
    }
    if (!ammoOk) return;

    weaponCooldownRef.current = weapon.cooldown;

    const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const spawnPos = playerPosition.clone().add(new THREE.Vector3(0, playerY + 1.2, 0)).addScaledVector(baseDir, 0.5);

    for (let i = 0; i < weapon.projectileCount; i++) {
      const dir = baseDir.clone();
      if (weapon.spread > 0) {
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * weapon.spread * 2);
        dir.y += (Math.random() - 0.5) * weapon.spread;
      }
      addProjectile(spawnPos.clone(), dir, "player");
    }
  };

  const mobileShootRef = useRef(false);
  
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
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Digit1") switchWeapon("slingshot");
      if (e.code === "Digit2") switchWeapon("shotgun");
      if (e.code === "Digit3") switchWeapon("sniper");
      if (e.code === "Space") jumpBuffered.current = true;
      if (e.code === "KeyQ" && gameMode === "blockhunt") {
        toggleDisguise();
        if (!isDisguised) {
          setDisguise("crate");
        } else {
          setDisguise(null);
        }
      }
    };
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
  }, [gl, gameMode, isDisguised, toggleDisguise]);

  useFrame((state, delta) => {
    if (!isPlaying || gameOver) return;

    if (weaponCooldownRef.current > 0) weaponCooldownRef.current -= delta;
    if (meleeCooldownRef.current > 0) meleeCooldownRef.current -= delta;

    const walkSpeed = BASE_WALK_SPEED * speedMultiplier;
    const sprintSpeed = BASE_SPRINT_SPEED * speedMultiplier;
    const staminaDrain = BASE_STAMINA_DRAIN * staminaDrainMultiplier;

    const wantsSprint = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const canSprint = stamina > 5;
    const isSprinting = wantsSprint && canSprint;
    if (isSprinting) useStamina(staminaDrain * delta);
    else regenStamina(STAMINA_REGEN * delta);
    const speed = isDisguised ? 0 : (isSprinting ? sprintSpeed : walkSpeed); // Can't move while disguised

    // --- Jumping physics with double jump & wall run ---
    const groundH = getGroundHeight(playerPosition.x, playerPosition.z, playerY);
    const onGround = playerY <= groundH + 0.05;

    if (onGround) {
      doubleJumpUsed.current = false;
      isWallRunning.current = false;
      wallRunTimer.current = 0;
    }

    // Wall run detection
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (!onGround && !isWallRunning.current && playerVelocityY < 0) {
      // Check for walls on left and right
      for (const side of [-1, 1]) {
        const checkPos = playerPosition.clone().addScaledVector(right, side * WALL_CHECK_DIST);
        const pMin = new THREE.Vector3(checkPos.x - 0.1, playerY, checkPos.z - 0.1);
        const pMax = new THREE.Vector3(checkPos.x + 0.1, playerY + 1.5, checkPos.z + 0.1);
        for (const c of wallColliders) {
          if (pMin.x < c.max.x && pMax.x > c.min.x && pMin.y < c.max.y && pMax.y > c.min.y && pMin.z < c.max.z && pMax.z > c.min.z) {
            // Touching wall — start wall run
            if ((keys.current["KeyW"] || keys.current["ArrowUp"]) && wallRunTimer.current < WALL_RUN_DURATION) {
              isWallRunning.current = true;
              wallRunSide.current = side;
              setPlayerVelocityY(0); // cancel falling
            }
            break;
          }
        }
        if (isWallRunning.current) break;
      }
    }

    // Wall running
    if (isWallRunning.current) {
      wallRunTimer.current += delta;
      if (wallRunTimer.current >= WALL_RUN_DURATION || !(keys.current["KeyW"] || keys.current["ArrowUp"])) {
        isWallRunning.current = false;
      } else {
        // Move forward along wall, slight upward
        setPlayerVelocityY(1); // slight lift
      }
    }

    if (jumpBuffered.current) {
      if (onGround) {
        setPlayerVelocityY(JUMP_VELOCITY);
        isGrounded.current = false;
        doubleJumpUsed.current = false;
      } else if (isWallRunning.current) {
        // Wall jump — launch away from wall
        setPlayerVelocityY(JUMP_VELOCITY * 0.9);
        isWallRunning.current = false;
        // Push away from wall
        playerPosition.addScaledVector(right, -wallRunSide.current * 2);
      } else if (!doubleJumpUsed.current) {
        // Double jump
        setPlayerVelocityY(DOUBLE_JUMP_VELOCITY);
        doubleJumpUsed.current = true;
      }
      jumpBuffered.current = false;
    }
    jumpBuffered.current = false; // consume

    // Apply gravity
    let vy = isWallRunning.current ? playerVelocityY : playerVelocityY + GRAVITY * delta;
    let newY = playerY + vy * delta;

    const newGroundH = getGroundHeight(playerPosition.x, playerPosition.z, newY);
    if (newY <= newGroundH) {
      newY = newGroundH;
      vy = 0;
      isGrounded.current = true;
    }

    setPlayerY(newY);
    setPlayerVelocityY(vy);

    // --- Horizontal movement ---

    const dir = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) dir.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) dir.sub(forward);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) dir.sub(right);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) dir.add(right);

    if (dir.lengthSq() > 0 && speed > 0) {
      dir.normalize().multiplyScalar(speed * delta);
      const newPos = playerPosition.clone().add(dir);
      newPos.x = THREE.MathUtils.clamp(newPos.x, bounds.minX, bounds.maxX);
      newPos.z = THREE.MathUtils.clamp(newPos.z, bounds.minZ, bounds.maxZ);

      // Wall collision at player's Y level
      const yBase = playerY;
      const pMin = new THREE.Vector3(newPos.x - PLAYER_RADIUS, yBase, newPos.z - PLAYER_RADIUS);
      const pMax = new THREE.Vector3(newPos.x + PLAYER_RADIUS, yBase + 1.8, newPos.z + PLAYER_RADIUS);
      let blocked = false;
      for (const c of wallColliders) {
        if (pMin.x < c.max.x && pMax.x > c.min.x && pMin.y < c.max.y && pMax.y > c.min.y && pMin.z < c.max.z && pMax.z > c.min.z) {
          blocked = true; break;
        }
      }
      if (!blocked) {
        playerPosition.copy(newPos);
      }
      // Apply wind push
      if (windForce.lengthSq() > 0.01) {
        playerPosition.x += windForce.x * delta * 0.4;
        playerPosition.z += windForce.z * delta * 0.4;
        playerPosition.x = THREE.MathUtils.clamp(playerPosition.x, bounds.minX, bounds.maxX);
        playerPosition.z = THREE.MathUtils.clamp(playerPosition.z, bounds.minZ, bounds.maxZ);
      }
      if (blocked) {
        const sx = playerPosition.clone(); sx.x += dir.x;
        let bx = false;
        const sxMin = new THREE.Vector3(sx.x - PLAYER_RADIUS, yBase, sx.z - PLAYER_RADIUS);
        const sxMax = new THREE.Vector3(sx.x + PLAYER_RADIUS, yBase + 1.8, sx.z + PLAYER_RADIUS);
        for (const c of wallColliders) {
          if (sxMin.x < c.max.x && sxMax.x > c.min.x && sxMin.y < c.max.y && sxMax.y > c.min.y && sxMin.z < c.max.z && sxMax.z > c.min.z) { bx = true; break; }
        }
        if (!bx) playerPosition.x = sx.x;
        const sz = playerPosition.clone(); sz.z += dir.z;
        let bz = false;
        const szMin = new THREE.Vector3(sz.x - PLAYER_RADIUS, yBase, sz.z - PLAYER_RADIUS);
        const szMax = new THREE.Vector3(sz.x + PLAYER_RADIUS, yBase + 1.8, sz.z + PLAYER_RADIUS);
        for (const c of wallColliders) {
          if (szMin.x < c.max.x && szMax.x > c.min.x && szMin.y < c.max.y && szMax.y > c.min.y && szMin.z < c.max.z && szMax.z > c.min.z) { bz = true; break; }
        }
        if (!bz) playerPosition.z = sz.z;
      }
      if (meshRef.current) {
        const t = state.clock.elapsedTime;
        // Bob only when on ground
        if (isGrounded.current) {
          meshRef.current.position.y = playerY + Math.abs(Math.sin(t * (isSprinting ? 14 : 8))) * 0.06;
        }
      }
    }

    if (meshRef.current) {
      meshRef.current.position.x = playerPosition.x;
      meshRef.current.position.y = playerY;
      meshRef.current.position.z = playerPosition.z;
      meshRef.current.rotation.y = yaw.current + Math.PI;
    }

    const camOffset = new THREE.Vector3(
      Math.sin(yaw.current) * CAMERA_DIST,
      CAMERA_HEIGHT * pitch.current + 1.8 + playerY,
      Math.cos(yaw.current) * CAMERA_DIST
    );
    const targetCamPos = playerPosition.clone().add(camOffset);
    targetCamPos.y = camOffset.y; // absolute Y for camera
    camera.position.lerp(targetCamPos, 0.1);
    camera.lookAt(playerPosition.x, playerY + 1.3, playerPosition.z);

    // Escape portal
    if (role === "runner" && escapeOpen) {
      const dx = playerPosition.x - escapePos[0];
      const dz = playerPosition.z - escapePos[2];
      if (Math.sqrt(dx * dx + dz * dz) < ESCAPE_ZONE_RADIUS) setEscaped();
    }

    // Medkit collection
    for (const med of medkits) {
      const dx = playerPosition.x - med.position[0];
      const dz = playerPosition.z - med.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < 1.5 && playerHealth < maxHealth) {
        healPlayer();
        collectMedkit(med.id);
        break;
      }
    }

    // Ammo pickup
    if (role === "runner") {
      for (const ap of ammoPickups) {
        const dx = playerPosition.x - ap.position[0];
        const dz = playerPosition.z - ap.position[2];
        if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
          collectAmmo(ap.id);
          break;
        }
      }
    }

    // Coin collection
    for (const coin of coinPickups) {
      const dx = playerPosition.x - coin.position[0];
      const dz = playerPosition.z - coin.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
        collectCoin(coin.id);
        break;
      }
    }

    // KOTH zone scoring
    if (gameMode === "koth" && kothZone) {
      const dx = playerPosition.x - kothZone[0];
      const dz = playerPosition.z - kothZone[2];
      if (Math.sqrt(dx * dx + dz * dz) < 4) {
        addKothScore(delta * 5);
      }
    }

    // Checkpoint collection (speedrun, parkour, deathrun)
    if ((gameMode === "speedrun" || gameMode === "parkour" || gameMode === "deathrun") && checkpoints.length > 0 && checkpointIndex < checkpoints.length) {
      const cp = checkpoints[checkpointIndex];
      const dx = playerPosition.x - cp[0];
      const dy = playerY - cp[1];
      const dz = playerPosition.z - cp[2];
      const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist3d < 3) {
        advanceCheckpoint();
      }
    }

    // CTF: grab flag
    if (gameMode === "ctf" && flagPosition && !flagCarried) {
      const dx = playerPosition.x - flagPosition[0];
      const dz = playerPosition.z - flagPosition[2];
      if (Math.sqrt(dx * dx + dz * dz) < 2) {
        grabFlag();
      }
    }

    // CTF: return flag to base
    if (gameMode === "ctf" && flagCarried && basePosition) {
      const dx = playerPosition.x - basePosition[0];
      const dz = playerPosition.z - basePosition[2];
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        returnFlag();
      }
    }

    // Deathrun: fall into lava/void = damage
    if (gameMode === "deathrun" && playerY < -2) {
      damagePlayer(1);
      // Reset to last checkpoint or start
      setPlayerY(0);
      setPlayerVelocityY(0);
      if (checkpointIndex > 0 && checkpoints[checkpointIndex - 1]) {
        playerPosition.set(checkpoints[checkpointIndex - 1][0], 0, checkpoints[checkpointIndex - 1][2]);
      } else {
        playerPosition.set(0, 0, 4);
      }
    }

    // NPC projectile hits
    for (const p of projectiles) {
      if (!p.alive || p.owner === "player") continue;
      const dx = p.position.x - playerPosition.x;
      const dy = p.position.y - (playerY + 1.0);
      const dz = p.position.z - playerPosition.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < HIT_RADIUS) {
        p.alive = false;
        damagePlayer(1);
        break;
      }
    }
  });

  return (
    <group ref={meshRef} position={[playerPosition.x, playerY, playerPosition.z]}>
      <PlayerFigure role={role} isDisguised={isDisguised} />
    </group>
  );
}
