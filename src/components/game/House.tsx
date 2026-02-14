import { useRef } from "react";
import * as THREE from "three";
import { useGame } from "./GameState";
import { useFrame } from "@react-three/fiber";

const wallMaterial = new THREE.MeshStandardMaterial({ color: "#e8e0d4", roughness: 0.9 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: "#8B7355", roughness: 0.8 });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#f5f0e8", roughness: 1 });
const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: "#5c3a1e", roughness: 0.7 });
const fabricMaterial = new THREE.MeshStandardMaterial({ color: "#6b4c3b", roughness: 0.95 });
const cushionMaterial = new THREE.MeshStandardMaterial({ color: "#c4573a", roughness: 0.9 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#888", metalness: 0.8, roughness: 0.3 });
const counterMaterial = new THREE.MeshStandardMaterial({ color: "#d4cfc7", roughness: 0.4, metalness: 0.1 });
const concreteMaterial = new THREE.MeshStandardMaterial({ color: "#999", roughness: 0.8 });
const grassMaterial = new THREE.MeshStandardMaterial({ color: "#4a7a3a", roughness: 1 });
const fenceMaterial = new THREE.MeshStandardMaterial({ color: "#8B6914", roughness: 0.8 });
const crateMaterial = new THREE.MeshStandardMaterial({ color: "#a0825a", roughness: 0.7 });
const escapeClosedMaterial = new THREE.MeshStandardMaterial({ color: "#8b0000", roughness: 0.5, emissive: "#330000", emissiveIntensity: 0.3 });
const escapeOpenMaterial = new THREE.MeshStandardMaterial({ color: "#00ff44", roughness: 0.3, emissive: "#00ff44", emissiveIntensity: 1, transparent: true, opacity: 0.7 });

export const wallColliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = [];

// Clear colliders on module reload
wallColliders.length = 0;

function Wall({ position, size, material: mat = wallMaterial }: { position: [number, number, number]; size: [number, number, number]; material?: THREE.MeshStandardMaterial }) {
  const halfSize = size.map(s => s / 2);
  const min = new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]);
  const max = new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]);

  const exists = wallColliders.some(c => c.min.equals(min) && c.max.equals(max));
  if (!exists) {
    wallColliders.push({ min, max });
  }

  return (
    <mesh position={position} material={mat} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Crate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Wall position={[0, 0.4, 0]} size={[0.8, 0.8, 0.8]} material={crateMaterial} />
    </group>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} material={fabricMaterial} castShadow>
        <boxGeometry args={[2, 0.5, 0.9]} />
      </mesh>
      <mesh position={[0, 0.6, -0.35]} material={fabricMaterial} castShadow>
        <boxGeometry args={[2, 0.5, 0.2]} />
      </mesh>
      <mesh position={[-0.4, 0.55, 0.05]} material={cushionMaterial} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.7]} />
      </mesh>
      <mesh position={[0.4, 0.55, 0.05]} material={cushionMaterial} castShadow>
        <boxGeometry args={[0.6, 0.12, 0.7]} />
      </mesh>
    </group>
  );
}

function Table({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
      </mesh>
      {[[-0.5, 0.2, -0.25], [0.5, 0.2, -0.25], [-0.5, 0.2, 0.25], [0.5, 0.2, 0.25]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={darkWoodMaterial} castShadow>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

function KitchenCounter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[3, 0.9, 0.6]} />
      </mesh>
      <mesh position={[0, 0.92, 0]} material={counterMaterial} castShadow>
        <boxGeometry args={[3.05, 0.05, 0.65]} />
      </mesh>
      <mesh position={[0.5, 0.93, 0]} material={metalMaterial} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.4]} />
      </mesh>
    </group>
  );
}

// Escape zone portal
function EscapeZone() {
  const { escapeOpen } = useGame();
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && escapeOpen) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[0, 0, -18]}>
      {/* Portal frame */}
      <mesh position={[0, 1.5, 0]} material={escapeOpen ? undefined : undefined} castShadow>
        <boxGeometry args={[3, 3, 0.2]} />
        <meshStandardMaterial color={escapeOpen ? "#002200" : "#220000"} roughness={0.5} />
      </mesh>
      {/* Portal surface */}
      <mesh ref={ref} position={[0, 1.5, 0]} material={escapeOpen ? escapeOpenMaterial : escapeClosedMaterial}>
        <boxGeometry args={[2.5, 2.5, 0.1]} />
      </mesh>
      {/* Light */}
      {escapeOpen && (
        <pointLight position={[0, 2, 1]} color="#00ff44" intensity={3} distance={10} />
      )}
      {/* Label */}
      <pointLight position={[0, 1.5, 2]} color={escapeOpen ? "#00ff44" : "#ff0000"} intensity={1} distance={6} />
    </group>
  );
}

export const ESCAPE_ZONE_POS = new THREE.Vector3(0, 0, -18);
export const ESCAPE_ZONE_RADIUS = 2;

export default function House() {
  const WH = 2.8;
  const WT = 0.15;

  return (
    <group>
      {/* ===== INDOOR FLOOR ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[12, 10]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WH, 0]} material={ceilingMaterial} receiveShadow>
        <planeGeometry args={[12, 10]} />
      </mesh>

      {/* ===== OUTDOOR GROUND ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -14]} material={grassMaterial} receiveShadow>
        <planeGeometry args={[30, 20]} />
      </mesh>
      {/* Front yard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 10]} material={grassMaterial} receiveShadow>
        <planeGeometry args={[30, 10]} />
      </mesh>

      {/* ===== OUTER WALLS ===== */}
      {/* Front wall with wide door */}
      <Wall position={[-4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, 5]} size={[6, 0.6, WT]} />

      {/* Back wall with door to yard */}
      <Wall position={[-4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, -5]} size={[6, 0.6, WT]} />

      {/* Side walls */}
      <Wall position={[-6, WH / 2, 0]} size={[WT, WH, 10]} />
      <Wall position={[6, WH / 2, 0]} size={[WT, WH, 10]} />

      {/* ===== INTERIOR WALLS ===== */}
      <Wall position={[-1.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[0, WH / 2, -2]} size={[WT, WH, 6]} />
      <Wall position={[4.5, WH / 2, -2]} size={[3, WH, WT]} />
      <Wall position={[1.2, WH / 2, -2]} size={[2.2, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[6, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[WT, WH, 6]} />

      {/* ===== OUTDOOR OBSTACLES ===== */}
      {/* Yard fence - large perimeter */}
      <Wall position={[-14, 0.6, -24]} size={[30, 1.2, WT]} material={fenceMaterial} />
      <Wall position={[-14, 0.6, -4]} size={[WT, 1.2, 20]} material={fenceMaterial} />
      <Wall position={[14, 0.6, -4]} size={[WT, 1.2, 20]} material={fenceMaterial} />
      <Wall position={[14, 0.6, 10]} size={[WT, 1.2, 10]} material={fenceMaterial} />
      <Wall position={[-14, 0.6, 10]} size={[WT, 1.2, 10]} material={fenceMaterial} />
      <Wall position={[0, 0.6, 15]} size={[28, 1.2, WT]} material={fenceMaterial} />

      {/* Outdoor cover: walls, crates, structures */}
      <Wall position={[-8, 1, -10]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[8, 1, -12]} size={[WT, 2, 4]} material={concreteMaterial} />
      <Wall position={[-5, 1, -16]} size={[WT, 2, 3]} material={concreteMaterial} />
      <Wall position={[5, 1, -8]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[-10, 1, -7]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[10, 1, -18]} size={[WT, 2, 3]} material={concreteMaterial} />
      <Wall position={[-8, 1, -20]} size={[4, 2, WT]} material={concreteMaterial} />
      <Wall position={[3, 1, -15]} size={[WT, 2, 4]} material={concreteMaterial} />

      {/* Crates scattered */}
      <Crate position={[-3, 0, -8]} />
      <Crate position={[-3.8, 0, -8]} />
      <Crate position={[-3.4, 0.8, -8]} />
      <Crate position={[7, 0, -15]} />
      <Crate position={[7.8, 0, -15]} />
      <Crate position={[-11, 0, -14]} />
      <Crate position={[-11, 0, -14.8]} />
      <Crate position={[12, 0, -8]} />
      <Crate position={[-7, 0, 8]} />
      <Crate position={[9, 0, 12]} />
      <Crate position={[9.8, 0, 12]} />

      {/* Front yard obstacles */}
      <Wall position={[-6, 1, 8]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[7, 1, 10]} size={[WT, 2, 3]} material={concreteMaterial} />

      {/* ===== FURNITURE ===== */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <Table position={[-3, 0, 2]} />
      <KitchenCounter position={[4.5, 0, 4.5]} />

      {/* ===== ESCAPE ZONE ===== */}
      <EscapeZone />

      {/* ===== LIGHTING ===== */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 15, 5]} intensity={0.6} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      {/* Indoor lights */}
      <pointLight position={[-3, 2.5, 3]} intensity={0.8} color="#fff5e0" distance={8} />
      <pointLight position={[3, 2.5, 3]} intensity={0.6} color="#fff8f0" distance={8} />
      <pointLight position={[4, 2.5, -3.5]} intensity={0.4} color="#ffe8c0" distance={6} />

      {/* Outdoor lights */}
      <pointLight position={[0, 4, -10]} intensity={0.5} color="#8899bb" distance={20} />
      <pointLight position={[-8, 4, -15]} intensity={0.3} color="#8899bb" distance={15} />
      <pointLight position={[8, 4, -15]} intensity={0.3} color="#8899bb" distance={15} />
      <pointLight position={[0, 4, 10]} intensity={0.4} color="#8899bb" distance={15} />

      {/* Sky color */}
      <fog attach="fog" args={["#1a1a2e", 5, 40]} />
    </group>
  );
}
