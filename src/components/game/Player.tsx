import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { wallColliders } from "./House";
import { useGame } from "./GameState";
import { COLLECTIBLE_DATA } from "./Collectible";

const SPEED = 3.5;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.6;

export default function Player() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const { collected, isPlaying, setNearestDistance } = useGame();
  const frameCount = useRef(0);

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

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return;

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
      velocity.current.copy(direction).multiplyScalar(SPEED * delta);
    } else {
      velocity.current.set(0, 0, 0);
    }

    // Try to move and check collisions
    const newPos = camera.position.clone().add(velocity.current);
    newPos.y = PLAYER_HEIGHT;

    const playerMin = new THREE.Vector3(newPos.x - PLAYER_RADIUS, 0, newPos.z - PLAYER_RADIUS);
    const playerMax = new THREE.Vector3(newPos.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, newPos.z + PLAYER_RADIUS);

    let blocked = false;
    for (const collider of wallColliders) {
      if (
        playerMin.x < collider.max.x &&
        playerMax.x > collider.min.x &&
        playerMin.y < collider.max.y &&
        playerMax.y > collider.min.y &&
        playerMin.z < collider.max.z &&
        playerMax.z > collider.min.z
      ) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      camera.position.copy(newPos);
    } else {
      const slideX = camera.position.clone();
      slideX.x += velocity.current.x;
      slideX.y = PLAYER_HEIGHT;
      const sxMin = new THREE.Vector3(slideX.x - PLAYER_RADIUS, 0, slideX.z - PLAYER_RADIUS);
      const sxMax = new THREE.Vector3(slideX.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, slideX.z + PLAYER_RADIUS);
      let blockedX = false;
      for (const c of wallColliders) {
        if (sxMin.x < c.max.x && sxMax.x > c.min.x && sxMin.y < c.max.y && sxMax.y > c.min.y && sxMin.z < c.max.z && sxMax.z > c.min.z) {
          blockedX = true;
          break;
        }
      }
      if (!blockedX) camera.position.x = slideX.x;

      const slideZ = camera.position.clone();
      slideZ.z += velocity.current.z;
      slideZ.y = PLAYER_HEIGHT;
      const szMin = new THREE.Vector3(slideZ.x - PLAYER_RADIUS, 0, slideZ.z - PLAYER_RADIUS);
      const szMax = new THREE.Vector3(slideZ.x + PLAYER_RADIUS, PLAYER_HEIGHT + 0.2, slideZ.z + PLAYER_RADIUS);
      let blockedZ = false;
      for (const c of wallColliders) {
        if (szMin.x < c.max.x && szMax.x > c.min.x && szMin.y < c.max.y && szMax.y > c.min.y && szMin.z < c.max.z && szMax.z > c.min.z) {
          blockedZ = true;
          break;
        }
      }
      if (!blockedZ) camera.position.z = slideZ.z;
    }

    // Update nearest hider distance every 5 frames
    frameCount.current++;
    if (isPlaying && frameCount.current % 5 === 0) {
      let nearest = Infinity;
      for (const item of COLLECTIBLE_DATA) {
        if (collected.has(item.id)) continue;
        const dist = camera.position.distanceTo(new THREE.Vector3(item.position[0], camera.position.y, item.position[2]));
        if (dist < nearest) nearest = dist;
      }
      setNearestDistance(nearest === Infinity ? null : nearest);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
}
