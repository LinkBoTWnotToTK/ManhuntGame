import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, GameMap, MAP_BOUNDS } from "./GameState";
import { playerPosition, setPlayerY, setPlayerVelocityY } from "./SharedState";

interface LooseObject {
  id: string;
  position: THREE.Vector3;
  type: "crate" | "barrel" | "box" | "sack" | "tire" | "icebox";
}

const GRAB_DISTANCE = 2.0;
const CARRY_OFFSET = new THREE.Vector3(0, 0.5, -1.5);

function getLooseObjects(map: GameMap): LooseObject[] {
  const objs: LooseObject[] = [];
  const types: LooseObject["type"][] = ["crate", "barrel", "box", "sack", "tire", "icebox"];

  const layouts: Record<GameMap, { pos: [number, number, number]; type: LooseObject["type"] }[]> = {
    suburban: [
      { pos: [-10, 0, -8], type: "crate" }, { pos: [12, 0, -5], type: "barrel" },
      { pos: [-15, 0, -18], type: "box" }, { pos: [8, 0, -22], type: "sack" },
      { pos: [-5, 0, -30], type: "crate" }, { pos: [18, 0, -12], type: "barrel" },
      { pos: [-20, 0, -35], type: "box" }, { pos: [10, 0, -40], type: "crate" },
      { pos: [25, 0, -8], type: "sack" }, { pos: [-25, 0, -15], type: "barrel" },
      { pos: [0, 0, -15], type: "box" }, { pos: [-8, 0, -45], type: "crate" },
    ],
    industrial: [
      { pos: [-12, 0, 5], type: "barrel" }, { pos: [15, 0, -5], type: "barrel" },
      { pos: [-20, 0, -15], type: "crate" }, { pos: [25, 0, -12], type: "tire" },
      { pos: [-8, 0, -25], type: "barrel" }, { pos: [10, 0, -30], type: "crate" },
      { pos: [-25, 0, -38], type: "barrel" }, { pos: [20, 0, -42], type: "tire" },
      { pos: [0, 0, -20], type: "crate" }, { pos: [-30, 0, -5], type: "barrel" },
      { pos: [30, 0, -25], type: "tire" }, { pos: [-15, 0, -48], type: "crate" },
    ],
    forest: [
      { pos: [-12, 0, 10], type: "sack" }, { pos: [15, 0, 5], type: "crate" },
      { pos: [-20, 0, -8], type: "sack" }, { pos: [10, 0, -15], type: "box" },
      { pos: [-8, 0, -30], type: "crate" }, { pos: [22, 0, -25], type: "sack" },
      { pos: [-30, 0, -35], type: "box" }, { pos: [18, 0, -48], type: "crate" },
      { pos: [0, 0, 20], type: "sack" }, { pos: [-25, 0, -50], type: "box" },
    ],
    arctic: [
      { pos: [-10, 0, 8], type: "icebox" }, { pos: [12, 0, -5], type: "icebox" },
      { pos: [-20, 0, -18], type: "crate" }, { pos: [18, 0, -22], type: "icebox" },
      { pos: [-5, 0, -35], type: "crate" }, { pos: [25, 0, -15], type: "icebox" },
      { pos: [-28, 0, -40], type: "crate" }, { pos: [10, 0, -45], type: "icebox" },
      { pos: [0, 0, 12], type: "icebox" }, { pos: [-18, 0, -50], type: "crate" },
    ],
    underground: [
      { pos: [-8, 0, 8], type: "barrel" }, { pos: [10, 0, -2], type: "crate" },
      { pos: [-18, 0, -12], type: "barrel" }, { pos: [15, 0, -18], type: "crate" },
      { pos: [-5, 0, -28], type: "barrel" }, { pos: [22, 0, -22], type: "crate" },
      { pos: [-25, 0, -35], type: "barrel" }, { pos: [8, 0, -42], type: "crate" },
      { pos: [0, 0, 15], type: "barrel" }, { pos: [-12, 0, -48], type: "crate" },
    ],
    volcano: [
      { pos: [-12, 0, 5], type: "crate" }, { pos: [15, 0, -8], type: "barrel" },
      { pos: [-22, 0, -20], type: "crate" }, { pos: [10, 0, -28], type: "barrel" },
      { pos: [-8, 0, -40], type: "crate" }, { pos: [25, 0, -15], type: "barrel" },
      { pos: [-28, 0, -45], type: "crate" }, { pos: [18, 0, -50], type: "barrel" },
      { pos: [0, 0, 18], type: "crate" }, { pos: [-18, 0, -55], type: "barrel" },
    ],
    space_station: [
      { pos: [-10, 0, 5], type: "box" }, { pos: [12, 0, -3], type: "crate" },
      { pos: [-18, 0, -15], type: "box" }, { pos: [20, 0, -10], type: "crate" },
      { pos: [-5, 0, -25], type: "box" }, { pos: [15, 0, -30], type: "crate" },
      { pos: [-22, 0, -38], type: "box" }, { pos: [8, 0, -45], type: "crate" },
      { pos: [0, 0, 15], type: "box" }, { pos: [-15, 0, -50], type: "crate" },
    ],
  };

  const mapLayout = layouts[map] || layouts.suburban;
  mapLayout.forEach((obj, i) => {
    objs.push({
      id: `loose_${map}_${i}`,
      position: new THREE.Vector3(...obj.pos),
      type: obj.type,
    });
  });
  return objs;
}

function LooseObjectMesh({ type }: { type: LooseObject["type"] }) {
  switch (type) {
    case "crate":
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#8B6914" roughness={0.85} />
        </mesh>
      );
    case "barrel":
      return (
        <group>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 12]} />
            <meshStandardMaterial color="#5a4020" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.31, 0.02, 6, 16]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      );
    case "box":
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <meshStandardMaterial color="#7a6a5a" roughness={0.9} />
        </mesh>
      );
    case "sack":
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color="#9a8a5a" roughness={0.95} flatShading />
        </mesh>
      );
    case "tire":
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[0.3, 0.12, 8, 16]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      );
    case "icebox":
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.55, 0.65]} />
          <meshStandardMaterial color="#99bbdd" roughness={0.2} metalness={0.1} transparent opacity={0.8} />
        </mesh>
      );
  }
}

// Exported so Player.tsx can check hatches
export interface HatchData {
  id: string;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3; // teleport destination
  isRevealed: boolean; // some are hidden under objects
  coverObjectId?: string; // loose object covering this hatch
}

export function getHatchPositions(map: GameMap): HatchData[] {
  // Each map has 2-3 hatches, some hidden under loose objects
  // Underground base is at y = -8
  const baseY = -8;
  const hatches: Record<GameMap, { pos: [number, number, number]; target: [number, number, number]; coveredBy?: number }[]> = {
    suburban: [
      { pos: [-10, 0, -8], target: [-10, baseY, -8], coveredBy: 0 },  // covered by loose obj 0
      { pos: [18, 0, -12], target: [18, baseY, -12], coveredBy: 5 },
      { pos: [0, 0, -30], target: [0, baseY, -30] },  // visible
    ],
    industrial: [
      { pos: [-12, 0, 5], target: [-12, baseY, 5], coveredBy: 0 },
      { pos: [25, 0, -12], target: [25, baseY, -12], coveredBy: 3 },
      { pos: [0, 0, -20], target: [0, baseY, -20] },
    ],
    forest: [
      { pos: [-12, 0, 10], target: [-12, baseY, 10], coveredBy: 0 },
      { pos: [22, 0, -25], target: [22, baseY, -25], coveredBy: 5 },
      { pos: [0, 0, -40], target: [0, baseY, -40] },
    ],
    arctic: [
      { pos: [-10, 0, 8], target: [-10, baseY, 8], coveredBy: 0 },
      { pos: [25, 0, -15], target: [25, baseY, -15], coveredBy: 5 },
      { pos: [0, 0, -35], target: [0, baseY, -35] },
    ],
    underground: [
      { pos: [-8, 0, 8], target: [-8, baseY, 8], coveredBy: 0 },
      { pos: [22, 0, -22], target: [22, baseY, -22], coveredBy: 5 },
    ],
    volcano: [
      { pos: [-12, 0, 5], target: [-12, baseY, 5], coveredBy: 0 },
      { pos: [25, 0, -15], target: [25, baseY, -15], coveredBy: 5 },
      { pos: [0, 0, -35], target: [0, baseY, -35] },
    ],
    space_station: [
      { pos: [-10, 0, 5], target: [-10, baseY, 5], coveredBy: 0 },
      { pos: [15, 0, -30], target: [15, baseY, -30], coveredBy: 5 },
      { pos: [0, 0, -20], target: [0, baseY, -20] },
    ],
  };

  const mapHatches = hatches[map] || hatches.suburban;
  return mapHatches.map((h, i) => ({
    id: `hatch_${map}_${i}`,
    position: new THREE.Vector3(...h.pos),
    targetPosition: new THREE.Vector3(...h.target),
    isRevealed: h.coveredBy === undefined,
    coverObjectId: h.coveredBy !== undefined ? `loose_${map}_${h.coveredBy}` : undefined,
  }));
}

// Underground base room rendered at y=-8
function UndergroundBase({ map }: { map: GameMap }) {
  const hatches = getHatchPositions(map);
  return (
    <group>
      {hatches.map((h) => {
        const cx = h.targetPosition.x;
        const cz = h.targetPosition.z;
        const by = -8;
        return (
          <group key={h.id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, by - 0.01, cz]}>
              <planeGeometry args={[12, 12]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[cx, by + 3, cz]}>
              <planeGeometry args={[12, 12]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
            </mesh>
            <mesh position={[cx, by + 1.5, cz - 6]}>
              <boxGeometry args={[12, 3, 0.3]} />
              <meshStandardMaterial color="#444" roughness={0.8} />
            </mesh>
            <mesh position={[cx, by + 1.5, cz + 6]}>
              <boxGeometry args={[12, 3, 0.3]} />
              <meshStandardMaterial color="#444" roughness={0.8} />
            </mesh>
            <mesh position={[cx - 6, by + 1.5, cz]}>
              <boxGeometry args={[0.3, 3, 12]} />
              <meshStandardMaterial color="#444" roughness={0.8} />
            </mesh>
            <mesh position={[cx + 6, by + 1.5, cz]}>
              <boxGeometry args={[0.3, 3, 12]} />
              <meshStandardMaterial color="#444" roughness={0.8} />
            </mesh>
            <mesh position={[cx, by + 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.8, 8]} />
              <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={1.5} />
            </mesh>
            <ambientLight intensity={0.4} />
          </group>
        );
      })}
    </group>
  );
}

export default function GrabbableObjects() {
  const { selectedMap, isPlaying, setNearHatch } = useGame();
  const map = selectedMap || "suburban";
  const [objects, setObjects] = useState<LooseObject[]>([]);
  const [hatches, setHatches] = useState<HatchData[]>([]);
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const [isUnderground, setIsUnderground] = useState(false);
  const objRefs = useRef<Map<string, THREE.Group>>(new Map());
  const bounds = MAP_BOUNDS[map];
  const ePressed = useRef(false);
  const eCooldown = useRef(0);

  // Initialize objects when map changes or game starts
  useEffect(() => {
    if (!isPlaying) return;
    setObjects(getLooseObjects(map));
    setHatches(getHatchPositions(map));
    setGrabbedId(null);
    setIsUnderground(false);
  }, [map, isPlaying]);

  // E key handler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE") ePressed.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") ePressed.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    eCooldown.current = Math.max(0, eCooldown.current - delta);

    // Check proximity to hatches for prompt
    let foundNearHatch = false;
    let promptText = "";
    for (const hatch of hatches) {
      if (!hatch.isRevealed) continue;
      if (isUnderground) {
        // When underground, check proximity to exit marker (targetPosition at y=-8)
        const dx = playerPosition.x - hatch.targetPosition.x;
        const dz = playerPosition.z - hatch.targetPosition.z;
        if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
          foundNearHatch = true;
          promptText = "Press E to return to surface";
          break;
        }
      } else {
        const dx = playerPosition.x - hatch.position.x;
        const dz = playerPosition.z - hatch.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
          foundNearHatch = true;
          promptText = "Press E to go underground";
          break;
        }
      }
    }
    setNearHatch(foundNearHatch, promptText);

    if (ePressed.current && eCooldown.current <= 0) {
      ePressed.current = false;
      eCooldown.current = 0.3;

      if (grabbedId) {
        // Drop the object
        setGrabbedId(null);
      } else {
        // Check if near a hatch
        for (const hatch of hatches) {
          const dx = playerPosition.x - hatch.position.x;
          const dz = playerPosition.z - hatch.position.z;
          const isNearHatch = Math.sqrt(dx * dx + dz * dz) < 2.0;

          if (isNearHatch && hatch.isRevealed) {
            if (!isUnderground) {
              // Go underground - teleport player to underground base
              playerPosition.set(hatch.targetPosition.x, 0, hatch.targetPosition.z);
              setPlayerY(-8);
              setPlayerVelocityY(0);
              setIsUnderground(true);
            } else {
              // Come back up - teleport to surface
              playerPosition.set(hatch.position.x, 0, hatch.position.z);
              setPlayerY(0);
              setPlayerVelocityY(0);
              setIsUnderground(false);
            }
            return;
          }
        }

        // Check if near a loose object to grab
        let nearestId: string | null = null;
        let nearestDist = GRAB_DISTANCE;
        for (const obj of objects) {
          const dx = playerPosition.x - obj.position.x;
          const dz = playerPosition.z - obj.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = obj.id;
          }
        }
        if (nearestId) {
          setGrabbedId(nearestId);
          // Check if moving this object reveals a hatch
          setHatches((prev) =>
            prev.map((h) => {
              if (h.coverObjectId === nearestId && !h.isRevealed) {
                return { ...h, isRevealed: true };
              }
              return h;
            })
          );
        }
      }
    }

    // Update grabbed object position to follow player
    if (grabbedId) {
      const obj = objects.find((o) => o.id === grabbedId);
      if (obj) {
        // Place object in front of player
        const forward = new THREE.Vector3(0, 0, -1); // will be rotated by player yaw
        // We don't have direct access to yaw, so just put it at player position offset
        obj.position.set(
          playerPosition.x + CARRY_OFFSET.x,
          playerPosition.y + CARRY_OFFSET.y + 0.5,
          playerPosition.z + CARRY_OFFSET.z
        );
      }
    }

    // Update mesh positions
    for (const obj of objects) {
      const group = objRefs.current.get(obj.id);
      if (group) {
        group.position.copy(obj.position);
        if (obj.id === grabbedId) {
          group.position.y += 0.3 + Math.sin(Date.now() * 0.005) * 0.05;
        }
      }
    }
  });

  if (!isPlaying) return null;

  return (
    <group>
      {/* Loose objects */}
      {objects.map((obj) => (
        <group
          key={obj.id}
          ref={(ref) => { if (ref) objRefs.current.set(obj.id, ref); }}
          position={[obj.position.x, obj.position.y + 0.35, obj.position.z]}
        >
          <LooseObjectMesh type={obj.type} />
          {/* Highlight when near player */}
        </group>
      ))}

      {/* Hatches */}
      {hatches.map((hatch) => (
        hatch.isRevealed && (
          <group key={hatch.id} position={[hatch.position.x, 0.02, hatch.position.z]}>
            {/* Hatch door */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[0.9, 16]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.5} />
            </mesh>
            {/* Hatch handle */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.3, 16]} />
              <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Glow indicator */}
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 0.9, 16]} />
              <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1} transparent opacity={0.6} />
            </mesh>
            <pointLight position={[0, 0.5, 0]} color="#ffaa00" intensity={1.5} distance={5} decay={2} />
          </group>
        )
      ))}

      {/* Underground bases */}
      <UndergroundBase map={map} />
    </group>
  );
}

// Export for Player.tsx to use
export { getLooseObjects };
