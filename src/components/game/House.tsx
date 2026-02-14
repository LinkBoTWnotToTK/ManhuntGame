import { useRef } from "react";
import * as THREE from "three";
import { useGame } from "./GameState";
import { useFrame } from "@react-three/fiber";

const wallMaterial = new THREE.MeshStandardMaterial({ color: "#d8d0c4", roughness: 0.9 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: "#8B7355", roughness: 0.8 });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#f5f0e8", roughness: 1 });
const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: "#5c3a1e", roughness: 0.7 });
const fabricMaterial = new THREE.MeshStandardMaterial({ color: "#6b4c3b", roughness: 0.95 });
const cushionMaterial = new THREE.MeshStandardMaterial({ color: "#c4573a", roughness: 0.9 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#888", metalness: 0.8, roughness: 0.3 });
const counterMaterial = new THREE.MeshStandardMaterial({ color: "#d4cfc7", roughness: 0.4, metalness: 0.1 });
const concreteMaterial = new THREE.MeshStandardMaterial({ color: "#888", roughness: 0.7 });
const grassMaterial = new THREE.MeshStandardMaterial({ color: "#3a6a2a", roughness: 1 });
const fenceMaterial = new THREE.MeshStandardMaterial({ color: "#6B5914", roughness: 0.8 });
const crateMaterial = new THREE.MeshStandardMaterial({ color: "#a0825a", roughness: 0.7 });
const brickMaterial = new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.85 });
const escapeClosedMaterial = new THREE.MeshStandardMaterial({ color: "#660000", roughness: 0.5, emissive: "#220000", emissiveIntensity: 0.3 });
const escapeOpenMaterial = new THREE.MeshStandardMaterial({ color: "#00ff44", roughness: 0.1, emissive: "#00ff44", emissiveIntensity: 2, transparent: true, opacity: 0.8 });

export const wallColliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = [];
wallColliders.length = 0;

function Wall({ position, size, material: mat = wallMaterial }: { position: [number, number, number]; size: [number, number, number]; material?: THREE.MeshStandardMaterial }) {
  const halfSize = size.map(s => s / 2);
  const min = new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]);
  const max = new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]);
  const exists = wallColliders.some(c => c.min.equals(min) && c.max.equals(max));
  if (!exists) wallColliders.push({ min, max });

  return (
    <mesh position={position} material={mat} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Crate({ position }: { position: [number, number, number] }) {
  return <Wall position={[position[0], position[1] + 0.4, position[2]]} size={[0.8, 0.8, 0.8]} material={crateMaterial} />;
}

function CrateStack({ position }: { position: [number, number, number] }) {
  return (
    <group>
      <Crate position={position} />
      <Crate position={[position[0] + 0.8, position[1], position[2]]} />
      <Crate position={[position[0] + 0.4, position[1] + 0.8, position[2]]} />
    </group>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} material={fabricMaterial} castShadow><boxGeometry args={[2, 0.5, 0.9]} /></mesh>
      <mesh position={[0, 0.6, -0.35]} material={fabricMaterial} castShadow><boxGeometry args={[2, 0.5, 0.2]} /></mesh>
      <mesh position={[-0.4, 0.55, 0.05]} material={cushionMaterial} castShadow><boxGeometry args={[0.6, 0.12, 0.7]} /></mesh>
      <mesh position={[0.4, 0.55, 0.05]} material={cushionMaterial} castShadow><boxGeometry args={[0.6, 0.12, 0.7]} /></mesh>
    </group>
  );
}

function KitchenCounter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} material={darkWoodMaterial} castShadow><boxGeometry args={[3, 0.9, 0.6]} /></mesh>
      <mesh position={[0, 0.92, 0]} material={counterMaterial} castShadow><boxGeometry args={[3.05, 0.05, 0.65]} /></mesh>
      <mesh position={[0.5, 0.93, 0]} material={metalMaterial} castShadow><boxGeometry args={[0.5, 0.08, 0.4]} /></mesh>
    </group>
  );
}

function EscapeZone() {
  const { escapeOpen } = useGame();
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!escapeOpen) return;
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.8;
      ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
    }
  });

  return (
    <group position={[0, 0, -18]}>
      {/* Portal frame */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[3.5, 3.5, 0.3]} />
        <meshStandardMaterial color={escapeOpen ? "#003300" : "#330000"} roughness={0.5} />
      </mesh>
      {/* Portal surface */}
      <mesh ref={ref} position={[0, 1.5, 0]} material={escapeOpen ? escapeOpenMaterial : escapeClosedMaterial}>
        <boxGeometry args={[2.8, 2.8, 0.15]} />
      </mesh>
      {/* Spinning ring when open */}
      {escapeOpen && (
        <mesh ref={ringRef} position={[0, 1.5, 0.2]}>
          <torusGeometry args={[1.6, 0.06, 8, 32]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
      )}
      {escapeOpen && <pointLight position={[0, 2, 2]} color="#00ff44" intensity={5} distance={15} />}
      <pointLight position={[0, 1.5, 3]} color={escapeOpen ? "#00ff44" : "#ff0000"} intensity={escapeOpen ? 2 : 0.5} distance={8} />
    </group>
  );
}

export const ESCAPE_ZONE_POS = new THREE.Vector3(0, 0, -18);
export const ESCAPE_ZONE_RADIUS = 2.5;

export default function House() {
  const WH = 2.8;
  const WT = 0.15;

  return (
    <group>
      {/* ===== INDOOR FLOOR + CEILING ===== */}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 10]} material={grassMaterial} receiveShadow>
        <planeGeometry args={[30, 10]} />
      </mesh>

      {/* ===== HOUSE OUTER WALLS ===== */}
      <Wall position={[-4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, 5]} size={[6, 0.6, WT]} />
      <Wall position={[-4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, -5]} size={[6, 0.6, WT]} />
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

      {/* ===== PERIMETER FENCE ===== */}
      <Wall position={[0, 0.6, -24]} size={[30, 1.2, WT]} material={fenceMaterial} />
      <Wall position={[-14, 0.6, -4]} size={[WT, 1.2, 40]} material={fenceMaterial} />
      <Wall position={[14, 0.6, -4]} size={[WT, 1.2, 40]} material={fenceMaterial} />
      <Wall position={[0, 0.6, 15]} size={[28, 1.2, WT]} material={fenceMaterial} />

      {/* ===== OUTDOOR COVER — lots of it ===== */}
      {/* Concrete walls for cover */}
      <Wall position={[-8, 1, -10]} size={[4, 2, WT]} material={concreteMaterial} />
      <Wall position={[-8, 1, -10]} size={[WT, 2, 3]} material={concreteMaterial} />
      <Wall position={[8, 1, -12]} size={[WT, 2, 5]} material={concreteMaterial} />
      <Wall position={[8, 1, -14.5]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[-5, 1, -16]} size={[WT, 2, 4]} material={concreteMaterial} />
      <Wall position={[-5, 1, -18]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[5, 1, -8]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[5, 1, -8]} size={[WT, 2, 3]} material={concreteMaterial} />
      <Wall position={[-10, 1, -7]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[-10, 1, -7]} size={[WT, 2, 2]} material={concreteMaterial} />
      <Wall position={[10, 1, -18]} size={[WT, 2, 4]} material={concreteMaterial} />
      <Wall position={[10, 1, -20]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[-8, 1, -20]} size={[5, 2, WT]} material={concreteMaterial} />
      <Wall position={[3, 1, -15]} size={[WT, 2, 5]} material={concreteMaterial} />
      <Wall position={[3, 1, -17.5]} size={[3, 2, WT]} material={concreteMaterial} />
      
      {/* L-shaped covers */}
      <Wall position={[-2, 1, -12]} size={[3, 2, WT]} material={brickMaterial} />
      <Wall position={[-3.5, 1, -13]} size={[WT, 2, 2]} material={brickMaterial} />
      <Wall position={[11, 1, -7]} size={[2, 2, WT]} material={brickMaterial} />
      <Wall position={[12, 1, -8]} size={[WT, 2, 2]} material={brickMaterial} />
      <Wall position={[-12, 1, -15]} size={[2, 2, WT]} material={brickMaterial} />
      <Wall position={[-12, 1, -16]} size={[WT, 2, 2]} material={brickMaterial} />

      {/* More scattered cover near escape zone */}
      <Wall position={[-4, 1, -21]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[4, 1, -21]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[-2, 1, -19]} size={[WT, 2, 2]} material={concreteMaterial} />
      <Wall position={[2, 1, -19]} size={[WT, 2, 2]} material={concreteMaterial} />

      {/* ===== CRATE CLUSTERS ===== */}
      <CrateStack position={[-3, 0, -8]} />
      <CrateStack position={[7, 0, -15]} />
      <CrateStack position={[-11, 0, -14]} />
      <CrateStack position={[12, 0, -8]} />
      <CrateStack position={[-7, 0, 8]} />
      <CrateStack position={[9, 0, 12]} />
      <Crate position={[0, 0, -9]} />
      <Crate position={[-6, 0, -13]} />
      <Crate position={[6, 0, -19]} />
      <Crate position={[-9, 0, -5]} />
      <Crate position={[11, 0, -15]} />

      {/* Front yard cover */}
      <Wall position={[-6, 1, 8]} size={[3, 2, WT]} material={concreteMaterial} />
      <Wall position={[-6, 1, 8]} size={[WT, 2, 2]} material={concreteMaterial} />
      <Wall position={[7, 1, 10]} size={[WT, 2, 4]} material={concreteMaterial} />
      <Wall position={[7, 1, 12]} size={[2, 2, WT]} material={concreteMaterial} />
      <Wall position={[-10, 1, 11]} size={[2, 2, WT]} material={brickMaterial} />
      <Wall position={[3, 1, 9]} size={[2, 2, WT]} material={brickMaterial} />

      {/* ===== FURNITURE ===== */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <KitchenCounter position={[4.5, 0, 4.5]} />

      {/* ===== ESCAPE ZONE ===== */}
      <EscapeZone />

      {/* ===== LIGHTING ===== */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 15, 5]} intensity={0.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      {/* Indoor */}
      <pointLight position={[-3, 2.5, 3]} intensity={0.7} color="#fff5e0" distance={8} />
      <pointLight position={[3, 2.5, 3]} intensity={0.5} color="#fff8f0" distance={8} />
      <pointLight position={[4, 2.5, -3.5]} intensity={0.4} color="#ffe8c0" distance={6} />

      {/* Outdoor — moonlit feel */}
      <pointLight position={[0, 6, -10]} intensity={0.6} color="#6688aa" distance={25} />
      <pointLight position={[-10, 5, -15]} intensity={0.3} color="#6688aa" distance={20} />
      <pointLight position={[10, 5, -15]} intensity={0.3} color="#6688aa" distance={20} />
      <pointLight position={[0, 5, 10]} intensity={0.4} color="#6688aa" distance={20} />
      <pointLight position={[-10, 5, 5]} intensity={0.2} color="#6688aa" distance={15} />
      <pointLight position={[10, 5, 5]} intensity={0.2} color="#6688aa" distance={15} />

      <fog attach="fog" args={["#0a0a1e", 3, 35]} />
    </group>
  );
}
