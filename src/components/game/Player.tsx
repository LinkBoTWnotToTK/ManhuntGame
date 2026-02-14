import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { wallColliders, ESCAPE_ZONE_POS, ESCAPE_ZONE_RADIUS } from "./House";
import { useGame } from "./GameState";
import { HUNTER_NPCS } from "./NPC";

const SPEED = 4;
const SPRINT_SPEED = 6;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.6;

export default function Player() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const { role, isPlaying, escapeOpen, setEscaped, gameOver } = useGame();
  const caughtRef = useRef(false);

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 4);

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [camera]);

  useFrame(() => {
    if (!controlsRef.current?.isLocked || !isPlaying || gameOver) return;

    const isSprinting = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const speed = isSprinting ? SPRINT_SPEED : SPEED;

    const direction = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current["KeyW"] || keys.current["ArrowUp"]) direction.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) direction.sub(forward);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) direction.sub(right);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) direction.add(right);

    if (direction.length() > 0) {
      direction.normalize();
      const delta = 1 / 60;
      velocity.current.copy(direction).multiplyScalar(speed * delta);
    } else {
      velocity.current.set(0, 0, 0);
    }

    const newPos = camera.position.clone().add(velocity.current);
    newPos.y = PLAYER_HEIGHT;

    // Bounds
    newPos.x = THREE.MathUtils.clamp(newPos.x, -13.5, 13.5);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -23.5, 14.5);

    const playerMin = new THREE.Vector3(newPos.x - PLAYER_RADIUS, 0, newPos.z - PLAYER_RADIUS);
    const playerMax = new THREE.Vector3(newPos.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, newPos.z + PLAYER_RADIUS);

    let blocked = false;
    for (const collider of wallColliders) {
      if (
        playerMin.x < collider.max.x && playerMax.x > collider.min.x &&
        playerMin.y < collider.max.y && playerMax.y > collider.min.y &&
        playerMin.z < collider.max.z && playerMax.z > collider.min.z
      ) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      camera.position.copy(newPos);
    } else {
      // Slide X
      const slideX = camera.position.clone();
      slideX.x += velocity.current.x;
      slideX.y = PLAYER_HEIGHT;
      const sxMin = new THREE.Vector3(slideX.x - PLAYER_RADIUS, 0, slideX.z - PLAYER_RADIUS);
      const sxMax = new THREE.Vector3(slideX.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, slideX.z + PLAYER_RADIUS);
      let blockedX = false;
      for (const c of wallColliders) {
        if (sxMin.x < c.max.x && sxMax.x > c.min.x && sxMin.y < c.max.y && sxMax.y > c.min.y && sxMin.z < c.max.z && sxMax.z > c.min.z) {
          blockedX = true; break;
        }
      }
      if (!blockedX) camera.position.x = slideX.x;

      // Slide Z
      const slideZ = camera.position.clone();
      slideZ.z += velocity.current.z;
      slideZ.y = PLAYER_HEIGHT;
      const szMin = new THREE.Vector3(slideZ.x - PLAYER_RADIUS, 0, slideZ.z - PLAYER_RADIUS);
      const szMax = new THREE.Vector3(slideZ.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, slideZ.z + PLAYER_RADIUS);
      let blockedZ = false;
      for (const c of wallColliders) {
        if (szMin.x < c.max.x && szMax.x > c.min.x && szMin.y < c.max.y && szMax.y > c.min.y && szMin.z < c.max.z && szMax.z > c.min.z) {
          blockedZ = true; break;
        }
      }
      if (!blockedZ) camera.position.z = slideZ.z;
    }

    // Check escape zone (runner only)
    if (role === "runner" && escapeOpen) {
      const flatPos = new THREE.Vector3(camera.position.x, 0, camera.position.z);
      const flatEscape = new THREE.Vector3(ESCAPE_ZONE_POS.x, 0, ESCAPE_ZONE_POS.z);
      if (flatPos.distanceTo(flatEscape) < ESCAPE_ZONE_RADIUS) {
        setEscaped();
      }
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
