import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useGame, GameMap, ESCAPE_POSITIONS } from "./GameState";
import { useFrame } from "@react-three/fiber";
import { createTexturedMaterials } from "./Textures";
import { platformColliders, addPlatformCollider } from "./SharedState";

let _mats: ReturnType<typeof createTexturedMaterials> | null = null;
let _matsMap: string | null = null;

function getMats() {
  if (!_mats) _mats = createTexturedMaterials();
  return _mats;
}

export function disposeMats() {
  if (_mats) {
    Object.values(_mats).forEach(mat => {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
    _mats = null;
    _matsMap = null;
  }
}

export const wallColliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = [];
const registeredColliders = new Set<string>();

function colliderKey(pos: [number, number, number], size: [number, number, number]) {
  return `${pos[0]},${pos[1]},${pos[2]},${size[0]},${size[1]},${size[2]}`;
}

function Wall({ position, size, material: mat }: { position: [number, number, number]; size: [number, number, number]; material?: THREE.MeshStandardMaterial }) {
  const mats = getMats();
  const usedMat = mat || mats.wall;
  useMemo(() => {
    const key = colliderKey(position, size);
    if (registeredColliders.has(key)) return;
    registeredColliders.add(key);
    const halfSize = size.map(s => s / 2);
    wallColliders.push({
      min: new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]),
      max: new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]),
    });
  }, [position, size]);

  return (
    <mesh position={position} material={usedMat}>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Crate({ position }: { position: [number, number, number] }) {
  const mats = getMats();
  return <Wall position={[position[0], position[1] + 0.4, position[2]]} size={[0.8, 0.8, 0.8]} material={mats.crate} />;
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

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 3, 6]} />
        <meshStandardMaterial color="#1a5a1a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <coneGeometry args={[1.0, 2, 6]} />
        <meshStandardMaterial color="#1e6e1e" roughness={0.85} />
      </mesh>
    </group>
  );
}

function SnowTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 3, 6]} />
        <meshStandardMaterial color="#1a4a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.0, 0]}>
        <coneGeometry args={[1.0, 2, 6]} />
        <meshStandardMaterial color="#2a5a3a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.9, 0]}>
        <coneGeometry args={[0.6, 0.5, 6]} />
        <meshStandardMaterial color="#eeeeff" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Lamppost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4, 6]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffeeaa" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 4.2, 0]} color="#ffeedd" intensity={3} distance={15} decay={2} />
    </group>
  );
}

function Barrel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 1, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3 * scale, position[2]]} scale={scale}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#666655" roughness={0.95} flatShading />
    </mesh>
  );
}

function IceRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3 * scale, position[2]]} scale={scale}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#8899bb" roughness={0.2} metalness={0.1} transparent opacity={0.85} />
    </mesh>
  );
}

function Container({ position, rotation = 0, color = "#cc4444" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  const halfW = 1.5, halfH = 1.3, halfD = 3;
  useMemo(() => {
    const key = `container-${position[0]}-${position[2]}-${rotation}`;
    if (registeredColliders.has(key)) return;
    registeredColliders.add(key);
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    const corners = [
      [-halfD, -halfW], [-halfD, halfW], [halfD, -halfW], [halfD, halfW]
    ].map(([z, x]) => [x * cos - z * sin + position[0], x * sin + z * cos + position[2]]);
    const xs = corners.map(c => c[0]), zs = corners.map(c => c[1]);
    wallColliders.push({
      min: new THREE.Vector3(Math.min(...xs), 0, Math.min(...zs)),
      max: new THREE.Vector3(Math.max(...xs), halfH * 2, Math.max(...zs)),
    });
  }, [position, rotation]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, halfH, 0]}>
        <boxGeometry args={[halfW * 2, halfH * 2, halfD * 2]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Pipe({ position, length = 6 }: { position: [number, number, number]; length?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3, position[2]]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.25, 0.25, length, 8]} />
      <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

function VentDuct({ position, rotation = 0, length = 4 }: { position: [number, number, number]; rotation?: number; length?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1, length]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Campfire({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(clock.elapsedTime * 8) * 1.5;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.5, 0]} color="#ff6622" intensity={4} distance={12} decay={2} />
    </group>
  );
}

function Tent({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[1.8, 2, 4]} />
        <meshStandardMaterial color="#cc8844" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Igloo({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Snowdrift({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.2 * scale, position[2]]} scale={[scale * 2, scale * 0.5, scale * 1.5]}>
      <sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#e0e8f0" roughness={0.3} />
    </mesh>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} material={mats.fabric}><boxGeometry args={[2, 0.5, 0.9]} /></mesh>
      <mesh position={[0, 0.6, -0.35]} material={mats.fabric}><boxGeometry args={[2, 0.5, 0.2]} /></mesh>
    </group>
  );
}

function KitchenCounter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} material={mats.darkWood}><boxGeometry args={[3, 0.9, 0.6]} /></mesh>
      <mesh position={[0, 0.92, 0]} material={mats.counter}><boxGeometry args={[3.05, 0.05, 0.65]} /></mesh>
    </group>
  );
}

function Table({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.75, 0]} material={mats.darkWood}><boxGeometry args={[1.4, 0.06, 0.8]} /></mesh>
    </group>
  );
}

function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1, 0]} material={mats.darkWood}><boxGeometry args={[1.2, 2, 0.35]} /></mesh>
    </group>
  );
}

function FlowerPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 8]} />
        <meshStandardMaterial color="#b86b3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.25, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a6a1a" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#6a4a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.65, -0.22]}>
        <boxGeometry args={[1.8, 0.5, 0.06]} />
        <meshStandardMaterial color="#6a4a20" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Rug({ position, rotation = 0, color = "#6a2020" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, rotation]}>
      <planeGeometry args={[2.5, 1.8]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function Painting({ position, rotation = 0, color = "#2a4a8b" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.8, 0.6, 0.04]} />
        <meshStandardMaterial color="#3a2510" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.65, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function StreetLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 5, 6]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.1, 4.6, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.2]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffeeaa" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[1.1, 4.5, 0]} color="#ffeedd" intensity={4} distance={18} decay={2} />
    </group>
  );
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.5, 6, 4]} />
        <meshStandardMaterial color="#1a4a15" roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 0.25, 0.2]}>
        <sphereGeometry args={[0.35, 6, 4]} />
        <meshStandardMaterial color="#1e5518" roughness={0.95} />
      </mesh>
    </group>
  );
}

function GardenFence({ position, length = 6, rotation = 0 }: { position: [number, number, number]; length?: number; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} material={mats.fence}><boxGeometry args={[length, 0.8, 0.08]} /></mesh>
    </group>
  );
}

// ===== Elevated structures for verticality =====
function ElevatedPlatform({ position, size, color = "#555" }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  useMemo(() => {
    const key = `elev-${position.join(",")}-${size.join(",")}`;
    if (registeredColliders.has(key)) return;
    registeredColliders.add(key);
    addPlatformCollider(position, size);
    const halfSize = size.map(s => s / 2);
    wallColliders.push({
      min: new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]),
      max: new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]),
    });
  }, [position, size]);
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
    </mesh>
  );
}

function Ramp({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.75, 0]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[3, 0.2, 5]} />
        <meshStandardMaterial color="#777" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ===== ESCAPE ZONE =====
function EscapeZone({ escapePos }: { escapePos: [number, number, number] }) {
  const { escapeOpen } = useGame();
  const mats = getMats();
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!escapeOpen) return;
    const t = state.clock.elapsedTime;
    if (ref.current) { ref.current.rotation.y = t * 0.8; ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08); }
    if (ringRef.current) ringRef.current.rotation.z = t * 1.5;
  });

  return (
    <group position={escapePos}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.5, 3.5, 0.3]} />
        <meshStandardMaterial color={escapeOpen ? "#003300" : "#330000"} roughness={0.5} />
      </mesh>
      <mesh ref={ref} position={[0, 1.5, 0]} material={escapeOpen ? mats.escapeOpen : mats.escapeClosed}>
        <boxGeometry args={[2.8, 2.8, 0.15]} />
      </mesh>
      {escapeOpen && (
        <mesh ref={ringRef} position={[0, 1.5, 0.2]}>
          <torusGeometry args={[1.6, 0.06, 6, 24]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
      )}
      {escapeOpen && <pointLight position={[0, 2, 2]} color="#00ff44" intensity={5} distance={15} />}
      <pointLight position={[0, 1.5, 3]} color={escapeOpen ? "#00ff44" : "#ff0000"} intensity={escapeOpen ? 2 : 0.5} distance={8} />
    </group>
  );
}

export const ESCAPE_ZONE_RADIUS = 2.5;

// ===== SUBURBAN MAP =====
function SuburbanMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  const WH = 2.8, WT = 0.15;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor} receiveShadow><planeGeometry args={[12, 10]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WH, 0]} material={mats.ceiling}><planeGeometry args={[12, 10]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} material={mats.grass} receiveShadow><planeGeometry args={[72, 70]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 20]} material={mats.grass} receiveShadow><planeGeometry args={[72, 25]} /></mesh>

      {/* House walls */}
      <Wall position={[-4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, 5]} size={[6, 0.6, WT]} />
      <Wall position={[-4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, -5]} size={[3, WH, WT]} />
      <Wall position={[0, WH - 0.3, -5]} size={[6, 0.6, WT]} />
      <Wall position={[-6, WH / 2, 0]} size={[WT, WH, 10]} />
      <Wall position={[6, WH / 2, 0]} size={[WT, WH, 10]} />
      <Wall position={[-1.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[0, WH / 2, -2]} size={[WT, WH, 6]} />
      <Wall position={[4.5, WH / 2, -2]} size={[3, WH, WT]} />
      <Wall position={[1.2, WH / 2, -2]} size={[2.2, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[6, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[WT, WH, 6]} />
      
      {/* Perimeter */}
      <Wall position={[0, 0.6, -60]} size={[72, 1.2, WT]} material={mats.fence} />
      <Wall position={[-35, 0.6, -17]} size={[WT, 1.2, 86]} material={mats.fence} />
      <Wall position={[35, 0.6, -17]} size={[WT, 1.2, 86]} material={mats.fence} />
      <Wall position={[0, 0.6, 30]} size={[70, 1.2, WT]} material={mats.fence} />

      {/* Cover walls */}
      <Wall position={[-8, 1, -10]} size={[4, 2, WT]} material={mats.concrete} />
      <Wall position={[-8, 1, -10]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[8, 1, -12]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[8, 1, -14.5]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-5, 1, -16]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[5, 1, -8]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-2, 1, -12]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[15, 1, -15]} size={[4, 2, WT]} material={mats.concrete} />
      <Wall position={[-15, 1, -12]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[10, 1, -18]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-8, 1, -20]} size={[5, 2, WT]} material={mats.concrete} />
      <Wall position={[3, 1, -15]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[-4, 1, -28]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[4, 1, -28]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-8, 1, -35]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[8, 1, -35]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[12, 1, -30]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-12, 1, -30]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[20, 1, -25]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-20, 1, -22]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[-6, 1, -40]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[6, 1, -40]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[15, 1, -40]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-15, 1, -40]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[20, 1, -45]} size={[5, 2, WT]} material={mats.brick} />
      <Wall position={[-20, 1, -48]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[25, 1, -35]} size={[WT, 2, 6]} material={mats.concrete} />
      <Wall position={[-25, 1, -38]} size={[WT, 2, 5]} material={mats.concrete} />

      {/* Verticality: elevated walkways */}
      <ElevatedPlatform position={[-12, 2.5, -20]} size={[6, 0.3, 3]} color="#555" />
      <ElevatedPlatform position={[12, 2.5, -25]} size={[6, 0.3, 3]} color="#555" />
      <ElevatedPlatform position={[0, 3.5, -35]} size={[5, 0.3, 3]} color="#666" />
      <Ramp position={[-15, 0, -20]} rotation={Math.PI / 2} />
      <Ramp position={[15, 0, -25]} rotation={-Math.PI / 2} />

      <CrateStack position={[-3, 0, -8]} />
      <CrateStack position={[7, 0, -15]} />
      <CrateStack position={[-11, 0, -14]} />
      <CrateStack position={[12, 0, -8]} />
      <CrateStack position={[-18, 0, -18]} />
      <CrateStack position={[16, 0, -25]} />
      <CrateStack position={[-14, 0, -32]} />
      <CrateStack position={[14, 0, -35]} />
      <CrateStack position={[20, 0, -10]} />
      <CrateStack position={[-20, 0, -8]} />
      <CrateStack position={[0, 0, -25]} />
      <CrateStack position={[10, 0, -50]} />
      <CrateStack position={[-10, 0, -52]} />

      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <KitchenCounter position={[4.5, 0, 4.5]} />
      <Table position={[2, 0, -1.5]} />
      <Bookshelf position={[-5.5, 0, 2]} rotation={Math.PI / 2} />
      <FlowerPot position={[-2, 0.75, 4.5]} />
      <Rug position={[-2.5, 0, 2]} rotation={0.1} color="#5a2828" />
      <Painting position={[-2, 1.8, 4.9]} rotation={0} color="#3a5a3a" />

      <Bench position={[-10, 0, 12]} rotation={0.2} />
      <Bench position={[12, 0, 15]} rotation={-0.3} />
      <Bush position={[-7, 0, 5.5]} scale={0.8} />
      <Bush position={[7, 0, 5.5]} scale={0.9} />
      <GardenFence position={[-10, 0, 6.5]} length={4} rotation={0} />
      <GardenFence position={[10, 0, 6.5]} length={4} rotation={0} />

      <Tree position={[-12, 0, 8]} scale={1.2} />
      <Tree position={[14, 0, 10]} />
      <Tree position={[-20, 0, 15]} scale={1.3} />
      <Tree position={[22, 0, 12]} scale={0.9} />
      <Tree position={[-25, 0, -10]} scale={1.1} />
      <Tree position={[25, 0, -15]} />
      <Tree position={[-18, 0, -40]} scale={1.4} />
      <Tree position={[20, 0, -42]} scale={1.1} />
      <Tree position={[0, 0, -50]} />
      <Tree position={[-30, 0, -20]} scale={1.5} />
      <Tree position={[30, 0, -25]} scale={1.2} />
      <Tree position={[-28, 0, -50]} scale={1.3} />
      <Tree position={[28, 0, -50]} scale={1.1} />

      <Lamppost position={[-8, 0, 6]} />
      <Lamppost position={[8, 0, 6]} />
      <Lamppost position={[0, 0, -20]} />
      <Lamppost position={[-10, 0, -30]} />
      <Lamppost position={[10, 0, -30]} />
      <Lamppost position={[0, 0, -40]} />

      <Barrel position={[-7, 0, -6]} />
      <Barrel position={[9, 0, -10]} />
      <Barrel position={[-18, 0, -25]} />
      <Barrel position={[16, 0, -20]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.6} color="#c8d8ff" />
      <directionalLight position={[30, 35, -20]} intensity={1.5} color="#fff8e0" />
      <directionalLight position={[-15, 10, 10]} intensity={0.4} color="#aabbdd" />
      <pointLight position={[-3, 2.5, 3]} intensity={1.5} color="#ffe0a0" distance={10} decay={2} />
      <hemisphereLight args={["#87CEEB", "#4a7a3a", 0.4]} />
      <fog attach="fog" args={["#c8d8ff", 25, 90]} />
    </group>
  );
}

// ===== INDUSTRIAL MAP =====
function IndustrialMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.concrete} receiveShadow><planeGeometry args={[82, 90]} /></mesh>
      <Wall position={[0, 1.5, -65]} size={[82, 3, 0.3]} material={mats.concrete} />
      <Wall position={[-40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[0, 1.5, 30]} size={[80, 3, 0.3]} material={mats.concrete} />

      <Wall position={[-15, 2, 18]} size={[16, 4, 0.2]} material={mats.brick} />
      <Wall position={[-23, 2, 13]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-7, 2, 13]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-15, 2, 8]} size={[16, 4, 0.2]} material={mats.brick} />

      <Container position={[10, 0, 12]} color="#cc3333" />
      <Container position={[10, 0, 18]} color="#3366cc" />
      <Container position={[22, 0, 8]} rotation={Math.PI / 2} color="#cc8833" />
      <Container position={[-5, 0, -10]} color="#339933" />
      <Container position={[15, 0, -18]} rotation={0.3} color="#cc3333" />
      <Container position={[-22, 0, -22]} rotation={-0.2} color="#3366cc" />
      <Container position={[28, 0, -28]} color="#996633" />
      <Container position={[-12, 0, -35]} rotation={Math.PI / 4} color="#cc8833" />
      <Container position={[5, 0, -40]} color="#cc3333" />
      <Container position={[-28, 0, -48]} rotation={0.5} color="#339933" />
      <Container position={[22, 0, -50]} rotation={-0.3} color="#3366cc" />
      <Container position={[32, 0, -10]} rotation={0.8} color="#cc3333" />

      <Wall position={[-12, 1.2, -8]} size={[4, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[8, 1.2, -5]} size={[0.2, 2.4, 5]} material={mats.concrete} />
      <Wall position={[-8, 1.2, -28]} size={[6, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[12, 1.2, -33]} size={[0.2, 2.4, 6]} material={mats.concrete} />
      <Wall position={[-15, 1.2, -40]} size={[5, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[22, 1.2, -12]} size={[0.2, 2.4, 4]} material={mats.concrete} />

      {/* Verticality: catwalks */}
      <ElevatedPlatform position={[-15, 3, -15]} size={[8, 0.3, 2.5]} color="#666" />
      <ElevatedPlatform position={[15, 3, -30]} size={[8, 0.3, 2.5]} color="#666" />
      <ElevatedPlatform position={[0, 4, -45]} size={[6, 0.3, 2.5]} color="#777" />
      <Ramp position={[-19, 0, -15]} rotation={0} />
      <Ramp position={[19, 0, -30]} rotation={Math.PI} />

      <VentDuct position={[-30, 0, -5]} rotation={0} length={6} />
      <VentDuct position={[25, 0, -20]} rotation={Math.PI / 2} length={5} />
      <Pipe position={[-33, 0.5, -18]} length={8} />
      <Pipe position={[30, 0.5, -22]} length={6} />

      <Barrel position={[-3, 0, 5]} />
      <Barrel position={[5, 0, -8]} />
      <Barrel position={[-18, 0, -18]} />
      <Barrel position={[24, 0, -20]} />
      <CrateStack position={[-8, 0, 0]} />
      <CrateStack position={[18, 0, -8]} />
      <CrateStack position={[-24, 0, -32]} />
      <CrateStack position={[8, 0, -25]} />
      <CrateStack position={[30, 0, -40]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.4} color="#ffddaa" />
      <directionalLight position={[25, 30, -10]} intensity={1.2} color="#ffeedd" />
      <Lamppost position={[-22, 0, 2]} />
      <Lamppost position={[22, 0, 2]} />
      <Lamppost position={[0, 0, -18]} />
      <Lamppost position={[-18, 0, -28]} />
      <Lamppost position={[18, 0, -28]} />
      <Lamppost position={[0, 0, -40]} />
      <hemisphereLight args={["#ffddaa", "#554433", 0.3]} />
      <fog attach="fog" args={["#332211", 30, 95]} />
    </group>
  );
}

// ===== FOREST MAP =====
function ForestMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.grass} receiveShadow><planeGeometry args={[92, 105]} /></mesh>
      <Wall position={[0, 0.6, -70]} size={[92, 1.2, 0.15]} material={mats.fence} />
      <Wall position={[-45, 0.6, -18]} size={[0.15, 1.2, 105]} material={mats.fence} />
      <Wall position={[45, 0.6, -18]} size={[0.15, 1.2, 105]} material={mats.fence} />
      <Wall position={[0, 0.6, 35]} size={[90, 1.2, 0.15]} material={mats.fence} />

      <Wall position={[-10, 0.8, -8]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[12, 0.8, -12]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-18, 0.8, -22]} size={[4, 1.6, 1.5]} material={mats.concrete} />
      <Wall position={[8, 0.8, -28]} size={[1.5, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-5, 0.8, -38]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[22, 0.8, -20]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-28, 0.8, -33]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[15, 0.8, -42]} size={[2, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-14, 0.8, -50]} size={[4, 1.6, 2]} material={mats.concrete} />
      <Wall position={[0, 0.8, -18]} size={[2.5, 1.6, 2.5]} material={mats.concrete} />

      <Wall position={[-8, 0.6, -20]} size={[5, 1.2, 0.3]} material={mats.crate} />
      <Wall position={[5, 0.6, -33]} size={[0.3, 1.2, 4]} material={mats.crate} />

      {/* Verticality: treehouse platforms */}
      <ElevatedPlatform position={[-20, 3, -15]} size={[5, 0.3, 5]} color="#4a3020" />
      <ElevatedPlatform position={[25, 4, -30]} size={[5, 0.3, 4]} color="#4a3020" />
      <ElevatedPlatform position={[0, 5, -50]} size={[6, 0.3, 4]} color="#4a3020" />

      <Tree position={[-8, 0, 5]} scale={1.3} />
      <Tree position={[10, 0, 8]} scale={1.1} />
      <Tree position={[-22, 0, 14]} scale={1.5} />
      <Tree position={[24, 0, 18]} />
      <Tree position={[-32, 0, 8]} scale={1.4} />
      <Tree position={[30, 0, 5]} scale={1.2} />
      <Tree position={[-15, 0, -5]} />
      <Tree position={[18, 0, -3]} scale={1.3} />
      <Tree position={[-28, 0, -18]} scale={1.6} />
      <Tree position={[28, 0, -15]} scale={1.1} />
      <Tree position={[-5, 0, -25]} scale={1.2} />
      <Tree position={[15, 0, -22]} scale={1.4} />
      <Tree position={[-20, 0, -30]} />
      <Tree position={[24, 0, -33]} scale={1.3} />
      <Tree position={[-33, 0, -40]} scale={1.5} />
      <Tree position={[33, 0, -42]} scale={1.1} />
      <Tree position={[-14, 0, -45]} />
      <Tree position={[10, 0, -48]} scale={1.4} />
      <Tree position={[0, 0, -55]} scale={1.6} />
      <Tree position={[-38, 0, 22]} scale={1.7} />
      <Tree position={[38, 0, 20]} scale={1.3} />

      <Rock position={[-6, 0, -10]} scale={1.5} />
      <Rock position={[8, 0, -8]} scale={1.2} />
      <Rock position={[-15, 0, -25]} scale={1.8} />
      <Rock position={[12, 0, -28]} />
      <Rock position={[-24, 0, -38]} scale={1.3} />

      <Campfire position={[0, 0, 5]} />
      <Tent position={[-4, 0, 8]} rotation={0.3} />
      <Tent position={[3, 0, 10]} rotation={-0.5} />
      <CrateStack position={[5, 0, 5]} />
      <Campfire position={[-22, 0, -12]} />
      <Campfire position={[0, 0, -35]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.5} color="#eeddcc" />
      <directionalLight position={[35, 25, 10]} intensity={1.3} color="#ffe8c0" />
      <hemisphereLight args={["#87CEEB", "#2a5420", 0.5]} />
      <fog attach="fog" args={["#aabbaa", 18, 80]} />
    </group>
  );
}

// ===== ARCTIC MAP =====
function ArcticMap({ escapePos }: { escapePos: [number, number, number] }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.3} />
      </mesh>

      <Wall position={[0, 1.5, -65]} size={[82, 3, 0.3]} />
      <Wall position={[-40, 1.5, -18]} size={[0.3, 3, 94]} />
      <Wall position={[40, 1.5, -18]} size={[0.3, 3, 94]} />
      <Wall position={[0, 1.5, 30]} size={[80, 3, 0.3]} />

      <Wall position={[-10, 1, -10]} size={[4, 2, 0.4]} />
      <Wall position={[12, 1, -15]} size={[0.4, 2, 5]} />
      <Wall position={[-18, 1, -25]} size={[5, 2, 0.4]} />
      <Wall position={[8, 1, -20]} size={[4, 2, 0.4]} />
      <Wall position={[-5, 1, -35]} size={[0.4, 2, 4]} />
      <Wall position={[20, 1, -30]} size={[4, 2, 0.4]} />
      <Wall position={[-25, 1, -40]} size={[3, 2, 0.4]} />
      <Wall position={[15, 1, -45]} size={[0.4, 2, 5]} />
      <Wall position={[0, 1, -28]} size={[3, 2, 3]} />

      {/* Verticality: ice ledges */}
      <ElevatedPlatform position={[-15, 2.5, -20]} size={[5, 0.3, 4]} color="#aabbcc" />
      <ElevatedPlatform position={[18, 3, -35]} size={[5, 0.3, 4]} color="#aabbcc" />

      <Igloo position={[-15, 0, 10]} />
      <Igloo position={[18, 0, 15]} />
      <Igloo position={[-25, 0, -8]} />

      <SnowTree position={[-8, 0, 5]} scale={1.2} />
      <SnowTree position={[10, 0, 8]} scale={1.0} />
      <SnowTree position={[-22, 0, 18]} scale={1.4} />
      <SnowTree position={[25, 0, 20]} scale={1.1} />
      <SnowTree position={[-30, 0, -12]} scale={1.3} />
      <SnowTree position={[30, 0, -10]} />
      <SnowTree position={[-15, 0, -20]} scale={1.5} />
      <SnowTree position={[18, 0, -25]} scale={1.2} />
      <SnowTree position={[-8, 0, -35]} scale={1.1} />
      <SnowTree position={[12, 0, -38]} scale={1.4} />
      <SnowTree position={[-25, 0, -45]} scale={1.6} />
      <SnowTree position={[25, 0, -48]} scale={1.2} />
      <SnowTree position={[0, 0, -55]} scale={1.3} />

      <Snowdrift position={[-5, 0, 0]} scale={1.5} />
      <Snowdrift position={[8, 0, -12]} scale={1.2} />
      <Snowdrift position={[-20, 0, -30]} scale={1.8} />
      <Snowdrift position={[15, 0, -20]} scale={1.0} />

      <IceRock position={[-12, 0, -5]} scale={1.5} />
      <IceRock position={[15, 0, -8]} scale={1.2} />
      <IceRock position={[-22, 0, -35]} scale={1.8} />

      <CrateStack position={[-6, 0, 12]} />
      <CrateStack position={[12, 0, -18]} />
      <CrateStack position={[-18, 0, -38]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.7} color="#dde8ff" />
      <directionalLight position={[30, 30, -15]} intensity={1.4} color="#eef4ff" />
      <hemisphereLight args={["#aabbdd", "#667788", 0.5]} />
      <fog attach="fog" args={["#c0d0e0", 25, 90]} />
    </group>
  );
}

// ===== UNDERGROUND MAP =====
function UndergroundMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.concrete} receiveShadow><planeGeometry args={[72, 84]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, -18]}>
        <planeGeometry args={[72, 84]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>

      <Wall position={[0, 2, -60]} size={[72, 4, 0.5]} material={mats.concrete} />
      <Wall position={[-35, 2, -18]} size={[0.5, 4, 84]} material={mats.concrete} />
      <Wall position={[35, 2, -18]} size={[0.5, 4, 84]} material={mats.concrete} />
      <Wall position={[0, 2, 25]} size={[70, 4, 0.5]} material={mats.concrete} />

      <Wall position={[-15, 2, 10]} size={[0.4, 4, 12]} material={mats.brick} />
      <Wall position={[-15, 2, -10]} size={[0.4, 4, 12]} material={mats.brick} />
      <Wall position={[15, 2, 8]} size={[0.4, 4, 10]} material={mats.brick} />
      <Wall position={[15, 2, -12]} size={[0.4, 4, 14]} material={mats.brick} />
      <Wall position={[-8, 2, -4]} size={[14, 4, 0.4]} material={mats.brick} />
      <Wall position={[8, 2, -5]} size={[14, 4, 0.4]} material={mats.brick} />
      <Wall position={[0, 2, -20]} size={[30, 4, 0.4]} material={mats.brick} />
      <Wall position={[-10, 2, -30]} size={[0.4, 4, 8]} material={mats.brick} />
      <Wall position={[10, 2, -32]} size={[0.4, 4, 10]} material={mats.brick} />
      <Wall position={[0, 2, -38]} size={[20, 4, 0.4]} material={mats.brick} />
      <Wall position={[0, 2, -50]} size={[40, 4, 0.4]} material={mats.brick} />

      <VentDuct position={[-5, 0, 15]} rotation={0} length={8} />
      <VentDuct position={[20, 0, 0]} rotation={Math.PI / 2} length={6} />
      <Pipe position={[-8, 3, -10]} length={12} />
      <Pipe position={[8, 3, -20]} length={10} />

      <Barrel position={[-3, 0, 8]} />
      <Barrel position={[7, 0, -3]} />
      <Barrel position={[-22, 0, -8]} />
      <CrateStack position={[-12, 0, 5]} />
      <CrateStack position={[12, 0, 3]} />
      <CrateStack position={[-18, 0, -22]} />
      <CrateStack position={[18, 0, -25]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.2} color="#aabbcc" />
      <directionalLight position={[0, 10, -20]} intensity={0.4} color="#ddeeff" />
      <pointLight position={[0, 3.5, 10]} color="#ccddff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 3.5, -5]} color="#ccddff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 3.5, -25]} color="#ccddff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 3.5, -40]} color="#ccddff" intensity={3} distance={12} decay={2} />
      <pointLight position={[-30, 2, -5]} color="#ff2200" intensity={1.5} distance={8} decay={2} />
      <pointLight position={[30, 2, -8]} color="#ff2200" intensity={1.5} distance={8} decay={2} />
      <hemisphereLight args={["#556677", "#222233", 0.2]} />
      <fog attach="fog" args={["#1a1a22", 10, 55]} />
    </group>
  );
}

// ===== VOLCANO MAP =====
function VolcanoMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  const lavaRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (lavaRef.current) {
      const mat = lavaRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2 + Math.sin(clock.elapsedTime * 2) * 0.8;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
      </mesh>

      <mesh ref={lavaRef} rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.05, -25]}>
        <planeGeometry args={[3, 40]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.05, -15]}>
        <planeGeometry args={[2.5, 30]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} roughness={0.3} />
      </mesh>

      <Wall position={[0, 2, -65]} size={[82, 4, 0.5]} material={mats.concrete} />
      <Wall position={[-40, 2, -18]} size={[0.5, 4, 94]} material={mats.concrete} />
      <Wall position={[40, 2, -18]} size={[0.5, 4, 94]} material={mats.concrete} />
      <Wall position={[0, 2, 30]} size={[80, 4, 0.5]} material={mats.concrete} />

      <Wall position={[-8, 1.2, -10]} size={[4, 2.4, 2]} material={mats.brick} />
      <Wall position={[10, 1.2, -15]} size={[2, 2.4, 4]} material={mats.brick} />
      <Wall position={[-22, 1.2, -20]} size={[5, 2.4, 1.5]} material={mats.brick} />
      <Wall position={[25, 1.2, -25]} size={[3, 2.4, 2]} material={mats.brick} />
      <Wall position={[-5, 1.2, -35]} size={[3, 2.4, 3]} material={mats.brick} />
      <Wall position={[12, 1.2, -40]} size={[2, 2.4, 4]} material={mats.brick} />
      <Wall position={[0, 1.2, -20]} size={[3, 2.4, 2]} material={mats.brick} />

      {/* Verticality: lava rock pillars */}
      <ElevatedPlatform position={[-20, 3, -30]} size={[5, 0.3, 4]} color="#4a2a0a" />
      <ElevatedPlatform position={[22, 3.5, -40]} size={[5, 0.3, 4]} color="#4a2a0a" />

      <Rock position={[-6, 0, -5]} scale={2.0} />
      <Rock position={[8, 0, -8]} scale={1.5} />
      <Rock position={[-20, 0, -30]} scale={2.2} />
      <Rock position={[15, 0, -22]} scale={1.8} />
      <Rock position={[-10, 0, -45]} scale={1.6} />
      <Rock position={[25, 0, -48]} scale={2.0} />

      <CrateStack position={[-8, 0, 5]} />
      <CrateStack position={[12, 0, -18]} />
      <CrateStack position={[-22, 0, -38]} />
      <CrateStack position={[0, 0, -28]} />
      <Barrel position={[-3, 0, 8]} />
      <Barrel position={[7, 0, -3]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.3} color="#ff8844" />
      <directionalLight position={[25, 30, -15]} intensity={0.8} color="#ffeedd" />
      <pointLight position={[-15, 1, -15]} color="#ff4400" intensity={5} distance={15} decay={2} />
      <pointLight position={[-15, 1, -35]} color="#ff4400" intensity={5} distance={15} decay={2} />
      <pointLight position={[18, 1, -10]} color="#ff3300" intensity={4} distance={12} decay={2} />
      <pointLight position={[0, 3, 0]} color="#ffaa44" intensity={2} distance={20} decay={2} />
      <hemisphereLight args={["#ff8844", "#331100", 0.3]} />
      <fog attach="fog" args={["#1a0800", 20, 80]} />
    </group>
  );
}

// ===== SPACE STATION MAP =====
function SpaceStationMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} receiveShadow>
        <planeGeometry args={[72, 80]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, -15]}>
        <planeGeometry args={[72, 80]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.5} />
      </mesh>

      <Wall position={[0, 2.25, -55]} size={[72, 4.5, 0.5]} material={mats.concrete} />
      <Wall position={[-35, 2.25, -15]} size={[0.5, 4.5, 80]} material={mats.concrete} />
      <Wall position={[35, 2.25, -15]} size={[0.5, 4.5, 80]} material={mats.concrete} />
      <Wall position={[0, 2.25, 25]} size={[70, 4.5, 0.5]} material={mats.concrete} />

      <Wall position={[-12, 2.25, 10]} size={[0.3, 4.5, 14]} material={mats.concrete} />
      <Wall position={[12, 2.25, 8]} size={[0.3, 4.5, 10]} material={mats.concrete} />
      <Wall position={[-12, 2.25, -12]} size={[0.3, 4.5, 14]} material={mats.concrete} />
      <Wall position={[12, 2.25, -14]} size={[0.3, 4.5, 16]} material={mats.concrete} />
      <Wall position={[0, 2.25, -5]} size={[24, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[0, 2.25, -35]} size={[30, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[-20, 2.25, -40]} size={[0.3, 4.5, 10]} material={mats.concrete} />
      <Wall position={[20, 2.25, -42]} size={[0.3, 4.5, 12]} material={mats.concrete} />
      <Wall position={[0, 2.25, -48]} size={[40, 4.5, 0.3]} material={mats.concrete} />

      <CrateStack position={[-20, 0, 15]} />
      <CrateStack position={[20, 0, 12]} />
      <CrateStack position={[-25, 0, -18]} />
      <CrateStack position={[25, 0, -20]} />
      <CrateStack position={[0, 0, -15]} />
      <Barrel position={[-5, 0, 8]} />
      <Barrel position={[5, 0, -10]} />
      <Pipe position={[-8, 3.5, -10]} length={12} />
      <Pipe position={[8, 3.5, -20]} length={10} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.25} color="#aabbdd" />
      <directionalLight position={[0, 12, -15]} intensity={0.5} color="#ddeeff" />
      <pointLight position={[0, 4, 10]} color="#4488ff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 4, -5]} color="#4488ff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 4, -25]} color="#4488ff" intensity={4} distance={15} decay={2} />
      <pointLight position={[0, 4, -50]} color="#4488ff" intensity={3} distance={12} decay={2} />
      <pointLight position={[-30, 2, -5]} color="#ff2200" intensity={1} distance={6} decay={2} />
      <pointLight position={[30, 2, -8]} color="#ff2200" intensity={1} distance={6} decay={2} />
      <hemisphereLight args={["#4466aa", "#111122", 0.3]} />
      <fog attach="fog" args={["#0a0a1a", 15, 60]} />
    </group>
  );
}

// ===== NEW MAP: RUINS =====
function RuinsMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#8a7a5a" roughness={0.9} />
      </mesh>

      <Wall position={[0, 1.5, -65]} size={[82, 3, 0.3]} material={mats.concrete} />
      <Wall position={[-40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[0, 1.5, 30]} size={[80, 3, 0.3]} material={mats.concrete} />

      {/* Crumbling pillars and walls */}
      <Wall position={[-10, 1.5, -10]} size={[1.5, 3, 1.5]} material={mats.concrete} />
      <Wall position={[10, 1.5, -10]} size={[1.5, 3, 1.5]} material={mats.concrete} />
      <Wall position={[-10, 1.5, -25]} size={[1.5, 3, 1.5]} material={mats.concrete} />
      <Wall position={[10, 1.5, -25]} size={[1.5, 3, 1.5]} material={mats.concrete} />
      <Wall position={[0, 1, -17]} size={[6, 2, 0.3]} material={mats.brick} />
      <Wall position={[-20, 0.8, -15]} size={[5, 1.6, 0.3]} material={mats.brick} />
      <Wall position={[20, 0.8, -18]} size={[5, 1.6, 0.3]} material={mats.brick} />
      <Wall position={[-15, 1, -35]} size={[0.3, 2, 6]} material={mats.brick} />
      <Wall position={[15, 1, -38]} size={[0.3, 2, 6]} material={mats.brick} />
      <Wall position={[0, 1, -45]} size={[8, 2, 0.3]} material={mats.brick} />
      <Wall position={[-25, 1, -28]} size={[4, 2, 0.3]} material={mats.concrete} />
      <Wall position={[25, 1, -32]} size={[4, 2, 0.3]} material={mats.concrete} />

      {/* Verticality: ruined arches and elevated walkways */}
      <ElevatedPlatform position={[0, 3, -17]} size={[8, 0.3, 2]} color="#8a7a5a" />
      <ElevatedPlatform position={[-15, 2.5, -25]} size={[6, 0.3, 3]} color="#7a6a4a" />
      <ElevatedPlatform position={[15, 3.5, -35]} size={[6, 0.3, 3]} color="#7a6a4a" />
      <ElevatedPlatform position={[0, 4, -50]} size={[5, 0.3, 4]} color="#6a5a3a" />

      <Rock position={[-5, 0, -8]} scale={1.8} />
      <Rock position={[8, 0, -5]} scale={1.5} />
      <Rock position={[-18, 0, -20]} scale={2.0} />
      <Rock position={[22, 0, -22]} scale={1.6} />
      <Rock position={[0, 0, -30]} scale={2.2} />
      <Rock position={[-28, 0, -42]} scale={1.4} />
      <Rock position={[28, 0, -48]} scale={1.8} />

      <CrateStack position={[-8, 0, 5]} />
      <CrateStack position={[12, 0, -12]} />
      <CrateStack position={[-20, 0, -40]} />
      <CrateStack position={[18, 0, -45]} />
      <Barrel position={[-3, 0, 10]} />
      <Barrel position={[6, 0, -20]} />

      <Tree position={[-30, 0, 10]} scale={1.2} />
      <Tree position={[30, 0, 8]} scale={1.0} />
      <Tree position={[-35, 0, -30]} scale={1.4} />
      <Tree position={[35, 0, -35]} scale={1.1} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.5} color="#e8d8b8" />
      <directionalLight position={[25, 30, -10]} intensity={1.0} color="#ffe8c0" />
      <hemisphereLight args={["#d8c8a0", "#5a4a2a", 0.4]} />
      <fog attach="fog" args={["#c8b890", 25, 85]} />
    </group>
  );
}

// ===== NEW MAP: SWAMP =====
function SwampMap({ escapePos }: { escapePos: [number, number, number] }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#2a3a1a" roughness={0.95} />
      </mesh>
      {/* Swamp water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.02, -20]}>
        <planeGeometry args={[15, 20]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, 0.02, -35]}>
        <planeGeometry args={[10, 15]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.2} transparent opacity={0.7} />
      </mesh>

      <Wall position={[0, 1, -65]} size={[82, 2, 0.3]} />
      <Wall position={[-40, 1, -18]} size={[0.3, 2, 94]} />
      <Wall position={[40, 1, -18]} size={[0.3, 2, 94]} />
      <Wall position={[0, 1, 30]} size={[80, 2, 0.3]} />

      <Wall position={[-5, 0.8, -12]} size={[4, 1.6, 0.3]} />
      <Wall position={[8, 0.8, -18]} size={[0.3, 1.6, 5]} />
      <Wall position={[-18, 0.8, -30]} size={[5, 1.6, 0.3]} />
      <Wall position={[22, 0.8, -25]} size={[4, 1.6, 0.3]} />
      <Wall position={[-8, 0.8, -42]} size={[0.3, 1.6, 6]} />
      <Wall position={[12, 0.8, -48]} size={[4, 1.6, 0.3]} />

      {/* Verticality: raised bog islands */}
      <ElevatedPlatform position={[-20, 1.5, -15]} size={[6, 0.3, 5]} color="#4a5a2a" />
      <ElevatedPlatform position={[20, 2, -30]} size={[5, 0.3, 4]} color="#4a5a2a" />
      <ElevatedPlatform position={[0, 2.5, -45]} size={[6, 0.3, 4]} color="#3a4a1a" />

      <Tree position={[-8, 0, 5]} scale={1.3} />
      <Tree position={[12, 0, 8]} scale={1.1} />
      <Tree position={[-25, 0, -5]} scale={1.6} />
      <Tree position={[28, 0, -10]} scale={1.2} />
      <Tree position={[-15, 0, -25]} scale={1.4} />
      <Tree position={[18, 0, -22]} scale={1.5} />
      <Tree position={[-30, 0, -40]} scale={1.7} />
      <Tree position={[30, 0, -42]} scale={1.3} />
      <Tree position={[0, 0, -55]} scale={1.5} />
      <Tree position={[-22, 0, 15]} scale={1.4} />
      <Tree position={[22, 0, 18]} scale={1.1} />

      <Rock position={[-3, 0, -8]} scale={1.4} />
      <Rock position={[6, 0, -15]} scale={1.2} />
      <Rock position={[-15, 0, -35]} scale={1.8} />

      <Campfire position={[5, 0, 5]} />
      <CrateStack position={[-10, 0, 10]} />
      <CrateStack position={[15, 0, -40]} />
      <Barrel position={[-5, 0, -20]} />
      <Barrel position={[10, 0, -30]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.35} color="#aabb88" />
      <directionalLight position={[20, 20, -10]} intensity={0.8} color="#dde8aa" />
      <pointLight position={[-12, 1, -20]} color="#44ff44" intensity={2} distance={12} decay={2} />
      <pointLight position={[15, 1, -35]} color="#44ff44" intensity={2} distance={12} decay={2} />
      <hemisphereLight args={["#88aa66", "#2a3a1a", 0.4]} />
      <fog attach="fog" args={["#3a4a2a", 15, 65]} />
    </group>
  );
}

// ===== NEW MAP: ROOFTOP =====
function RooftopMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      {/* Main rooftop */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} receiveShadow>
        <planeGeometry args={[72, 80]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.6} metalness={0.3} />
      </mesh>

      <Wall position={[0, 0.6, -55]} size={[72, 1.2, 0.3]} material={mats.concrete} />
      <Wall position={[-35, 0.6, -15]} size={[0.3, 1.2, 80]} material={mats.concrete} />
      <Wall position={[35, 0.6, -15]} size={[0.3, 1.2, 80]} material={mats.concrete} />
      <Wall position={[0, 0.6, 25]} size={[70, 1.2, 0.3]} material={mats.concrete} />

      {/* Building structures on rooftop */}
      <Wall position={[-15, 2, 10]} size={[8, 4, 0.3]} material={mats.concrete} />
      <Wall position={[-19, 2, 6]} size={[0.3, 4, 8]} material={mats.concrete} />
      <Wall position={[-11, 2, 6]} size={[0.3, 4, 8]} material={mats.concrete} />
      <Wall position={[-15, 2, 2]} size={[8, 4, 0.3]} material={mats.concrete} />

      <Wall position={[15, 2, -20]} size={[10, 4, 0.3]} material={mats.concrete} />
      <Wall position={[20, 2, -25]} size={[0.3, 4, 10]} material={mats.concrete} />
      <Wall position={[10, 2, -25]} size={[0.3, 4, 10]} material={mats.concrete} />
      <Wall position={[15, 2, -30]} size={[10, 4, 0.3]} material={mats.concrete} />

      {/* Heavy verticality: multiple levels */}
      <ElevatedPlatform position={[-15, 4.5, 6]} size={[8, 0.3, 8]} color="#555" />
      <ElevatedPlatform position={[15, 4.5, -25]} size={[10, 0.3, 10]} color="#555" />
      <ElevatedPlatform position={[0, 3, -10]} size={[6, 0.3, 4]} color="#666" />
      <ElevatedPlatform position={[-8, 2, -25]} size={[5, 0.3, 3]} color="#666" />
      <ElevatedPlatform position={[0, 5, -40]} size={[8, 0.3, 5]} color="#777" />
      <ElevatedPlatform position={[-20, 2.5, -35]} size={[5, 0.3, 4]} color="#555" />
      <ElevatedPlatform position={[25, 3, -45]} size={[5, 0.3, 4]} color="#555" />
      <Ramp position={[-20, 0, 2]} rotation={Math.PI} />
      <Ramp position={[20, 0, -30]} rotation={0} />
      <Ramp position={[0, 0, -10]} rotation={Math.PI / 2} />

      {/* HVAC units */}
      <Wall position={[-25, 1, 15]} size={[3, 2, 3]} material={mats.concrete} />
      <Wall position={[25, 1, 15]} size={[3, 2, 3]} material={mats.concrete} />
      <Wall position={[-28, 1, -10]} size={[3, 2, 3]} material={mats.concrete} />
      <Wall position={[28, 1, -40]} size={[3, 2, 3]} material={mats.concrete} />

      <CrateStack position={[-5, 0, 5]} />
      <CrateStack position={[8, 0, -5]} />
      <CrateStack position={[-12, 0, -30]} />
      <CrateStack position={[10, 0, -42]} />
      <Barrel position={[-3, 0, -15]} />
      <Barrel position={[5, 0, -25]} />
      <Pipe position={[-30, 0.5, -20]} length={10} />
      <Pipe position={[30, 0.5, 0]} length={8} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.5} color="#ccddff" />
      <directionalLight position={[30, 40, -15]} intensity={1.5} color="#ffeedd" />
      <pointLight position={[-15, 5, 6]} color="#ffdd88" intensity={2} distance={12} decay={2} />
      <pointLight position={[15, 5, -25]} color="#ffdd88" intensity={2} distance={12} decay={2} />
      <hemisphereLight args={["#88aadd", "#334455", 0.4]} />
      <fog attach="fog" args={["#aabbcc", 30, 100]} />
    </group>
  );
}

// ===== PLATFORM COMPONENT =====
function Platform({ position, size, color = "#556677", emissive }: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  emissive?: string;
}) {
  useMemo(() => {
    const key = `plat-${position.join(",")}-${size.join(",")}`;
    if (registeredColliders.has(key)) return;
    registeredColliders.add(key);
    addPlatformCollider(position, size);
    const halfSize = size.map(s => s / 2);
    wallColliders.push({
      min: new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]),
      max: new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]),
    });
  }, [position, size]);

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        metalness={0.3}
        emissive={emissive || color}
        emissiveIntensity={emissive ? 0.5 : 0.05}
      />
    </mesh>
  );
}

// ===== PARKOUR PLATFORMS (disabled) =====
function ParkourPlatforms() {
  return null;

  return (
    <group>
      {/* Starting ramp */}
      <group position={[0, 0.75, -3]} rotation={[-0.25, 0, 0]}>
        <mesh><boxGeometry args={[4, 0.25, 6]} /><meshStandardMaterial color="#667788" roughness={0.4} metalness={0.5} /></mesh>
      </group>

      {/* Stage 1: Wide start */}
      <Platform position={[0, 1.5, -8]} size={[6, 0.4, 5]} color="#44aa66" emissive="#22ff44" />

      {/* Stage 2: Zigzag */}
      <Platform position={[5, 2.5, -13]} size={[3.5, 0.35, 3.5]} color="#3399aa" emissive="#22bbff" />
      <Platform position={[-4, 3.2, -17]} size={[3.5, 0.35, 3.5]} color="#3399aa" emissive="#22bbff" />
      <Platform position={[3, 4, -21]} size={[3, 0.35, 3]} color="#4488aa" emissive="#22aaff" />

      {/* Stage 3: Bridge */}
      <Platform position={[0, 5, -26]} size={[8, 0.35, 2.5]} color="#8844aa" emissive="#aa44ff" />
      <mesh position={[-3, 2.5, -26]}><cylinderGeometry args={[0.25, 0.3, 5, 6]} /><meshStandardMaterial color="#555566" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[3, 2.5, -26]}><cylinderGeometry args={[0.25, 0.3, 5, 6]} /><meshStandardMaterial color="#555566" metalness={0.6} roughness={0.3} /></mesh>

      {/* Stage 4: Staircase */}
      <Platform position={[-6, 5.8, -30]} size={[3, 0.3, 3]} color="#aa6644" emissive="#ff8844" />
      <Platform position={[-2, 6.5, -33]} size={[2.5, 0.3, 2.5]} color="#aa6644" emissive="#ff8844" />
      <Platform position={[3, 7.2, -35]} size={[3, 0.3, 3]} color="#aa7744" emissive="#ffaa44" />
      <Platform position={[8, 7.8, -33]} size={[3, 0.3, 3]} color="#aa7744" emissive="#ffaa44" />

      {/* Stage 5: Floating islands */}
      <Platform position={[5, 8.5, -38]} size={[4, 0.4, 4]} color="#44aa88" emissive="#22ffaa" />
      <Platform position={[-2, 9, -41]} size={[3, 0.3, 3]} color="#44aaaa" emissive="#22ffff" />
      <Platform position={[0, 9.5, -45]} size={[3.5, 0.3, 3.5]} color="#4488cc" emissive="#44aaff" />

      {/* Stage 6: Finish */}
      <Platform position={[-4, 10.2, -48]} size={[3, 0.3, 3]} color="#aaaa44" emissive="#ffff22" />
      <Platform position={[0, 11, -52]} size={[7, 0.5, 7]} color="#ffcc00" emissive="#ffdd44" />

      {/* Visual markers */}
      <mesh position={[5, 2.7, -13]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.8, 6]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 11.3, -52]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#ffdd44" emissive="#ffdd44" emissiveIntensity={2} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Guard rails on bridge */}
      <mesh position={[-4, 5.6, -26]}><boxGeometry args={[0.1, 0.8, 2.5]} /><meshStandardMaterial color="#666688" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[4, 5.6, -26]}><boxGeometry args={[0.1, 0.8, 2.5]} /><meshStandardMaterial color="#666688" metalness={0.7} roughness={0.3} /></mesh>


      {/* Glow lights */}
      <pointLight position={[0, 2, -8]} color="#22ff44" intensity={2} distance={8} />
      <pointLight position={[0, 6, -26]} color="#aa44ff" intensity={2} distance={8} />
      <pointLight position={[5, 9, -38]} color="#22ffaa" intensity={2} distance={8} />
      <pointLight position={[0, 12, -52]} color="#ffdd44" intensity={3} distance={10} />
    </group>
  );
}

// ===== MAIN HOUSE COMPONENT =====
export default function House() {
  const { selectedMap, gameMode } = useGame();
  const map = selectedMap || "suburban";
  const escapePos = ESCAPE_POSITIONS[map] || ESCAPE_POSITIONS.suburban;

  useEffect(() => {
    return () => {
      wallColliders.length = 0;
      platformColliders.length = 0;
      registeredColliders.clear();
    };
  }, [map, gameMode]);

  const mapComponent = (() => {
    switch (map) {
      case "suburban": return <SuburbanMap escapePos={escapePos} />;
      case "industrial": return <IndustrialMap escapePos={escapePos} />;
      case "forest": return <ForestMap escapePos={escapePos} />;
      case "arctic": return <ArcticMap escapePos={escapePos} />;
      case "underground": return <UndergroundMap escapePos={escapePos} />;
      case "volcano": return <VolcanoMap escapePos={escapePos} />;
      case "space_station": return <SpaceStationMap escapePos={escapePos} />;
      case "ruins": return <RuinsMap escapePos={escapePos} />;
      case "swamp": return <SwampMap escapePos={escapePos} />;
      case "rooftop": return <RooftopMap escapePos={escapePos} />;
      default: return <SuburbanMap escapePos={escapePos} />;
    }
  })();

  return (
    <>
      {mapComponent}
      <ParkourPlatforms />
    </>
  );
}
