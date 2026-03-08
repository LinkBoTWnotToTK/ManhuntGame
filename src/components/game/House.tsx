import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useGame, GameMap, ESCAPE_POSITIONS } from "./GameState";
import { useFrame } from "@react-three/fiber";
import { createTexturedMaterials } from "./Textures";
import { platformColliders, addPlatformCollider } from "./SharedState";

let _mats: ReturnType<typeof createTexturedMaterials> | null = null;
function getMats() {
  if (!_mats) _mats = createTexturedMaterials();
  return _mats;
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
    <mesh position={position} material={usedMat} castShadow receiveShadow>
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

// ===== DECORATIVE PROPS =====
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
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffeeaa" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

function Barrel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={[position[0], 0.5, position[2]]}>
      <cylinderGeometry args={[0.35, 0.35, 1, 8]} />
      <meshStandardMaterial color="#8B4513" roughness={0.8} />
    </mesh>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3 * scale, position[2]]} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color="#666655" roughness={0.95} flatShading />
    </mesh>
  );
}

function IceRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3 * scale, position[2]]} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 1]} />
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
      <mesh position={[0, halfH, 0]} castShadow receiveShadow>
        <boxGeometry args={[halfW * 2, halfH * 2, halfD * 2]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, halfH * 2 + 0.02, 0]}>
        <boxGeometry args={[halfW * 2 + 0.1, 0.04, halfD * 2 + 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Pipe({ position, length = 6 }: { position: [number, number, number]; length?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.3, position[2]]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.25, 0.25, length, 12]} />
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
      {/* Vent grating */}
    </group>
  );
}

function Campfire({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 6]} />
        <meshStandardMaterial color="#4a2a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
    </group>
  );
}

function Tent({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
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
        <sphereGeometry args={[1.8, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 1.7]}>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#bbc8d0" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Snowdrift({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.2 * scale, position[2]]} scale={[scale * 2, scale * 0.5, scale * 1.5]} castShadow receiveShadow>
      <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#e0e8f0" roughness={0.3} />
    </mesh>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} material={mats.fabric} castShadow receiveShadow><boxGeometry args={[2, 0.5, 0.9]} /></mesh>
      <mesh position={[0, 0.6, -0.35]} material={mats.fabric} castShadow receiveShadow><boxGeometry args={[2, 0.5, 0.2]} /></mesh>
      <mesh position={[-0.4, 0.55, 0.05]} material={mats.cushion} castShadow><boxGeometry args={[0.6, 0.12, 0.7]} /></mesh>
      <mesh position={[0.4, 0.55, 0.05]} material={mats.cushion} castShadow><boxGeometry args={[0.6, 0.12, 0.7]} /></mesh>
    </group>
  );
}

function KitchenCounter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const mats = getMats();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} material={mats.darkWood} castShadow receiveShadow><boxGeometry args={[3, 0.9, 0.6]} /></mesh>
      <mesh position={[0, 0.92, 0]} material={mats.counter} castShadow receiveShadow><boxGeometry args={[3.05, 0.05, 0.65]} /></mesh>
      <mesh position={[0.5, 0.93, 0]} material={mats.metal} castShadow><boxGeometry args={[0.5, 0.08, 0.4]} /></mesh>
    </group>
  );
}

// ===== ESCAPE ZONE =====
function EscapeZone({ escapePos }: { escapePos: [number, number, number] }) {
  const { escapeOpen } = useGame();
  const mats = getMats();
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!escapeOpen || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.8;
    ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
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
      {/* Indoor floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor} receiveShadow><planeGeometry args={[12, 10]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WH, 0]} material={mats.ceiling} receiveShadow><planeGeometry args={[12, 10]} /></mesh>
      
      {/* Outdoor ground — larger */}
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
      
      {/* Interior walls */}
      <Wall position={[-1.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[4.5, WH / 2, 1]} size={[3, WH, WT]} />
      <Wall position={[0, WH / 2, -2]} size={[WT, WH, 6]} />
      <Wall position={[4.5, WH / 2, -2]} size={[3, WH, WT]} />
      <Wall position={[1.2, WH / 2, -2]} size={[2.2, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[6, WH, WT]} />
      <Wall position={[-3, WH / 2, -2]} size={[WT, WH, 6]} />
      
      {/* Perimeter fence — expanded */}
      <Wall position={[0, 0.6, -60]} size={[72, 1.2, WT]} material={mats.fence} />
      <Wall position={[-35, 0.6, -17]} size={[WT, 1.2, 86]} material={mats.fence} />
      <Wall position={[35, 0.6, -17]} size={[WT, 1.2, 86]} material={mats.fence} />
      <Wall position={[0, 0.6, 30]} size={[70, 1.2, WT]} material={mats.fence} />

      {/* Outdoor cover walls — many more */}
      <Wall position={[-8, 1, -10]} size={[4, 2, WT]} material={mats.concrete} />
      <Wall position={[-8, 1, -10]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[8, 1, -12]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[8, 1, -14.5]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-5, 1, -16]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[5, 1, -8]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-2, 1, -12]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-3.5, 1, -13]} size={[WT, 2, 2]} material={mats.brick} />
      <Wall position={[11, 1, -7]} size={[2, 2, WT]} material={mats.brick} />
      <Wall position={[12, 1, -8]} size={[WT, 2, 2]} material={mats.brick} />
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

      {/* Crates */}
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
      <CrateStack position={[-22, 0, 5]} />
      <CrateStack position={[18, 0, 8]} />
      <CrateStack position={[25, 0, -30]} />
      <CrateStack position={[-25, 0, -35]} />
      <CrateStack position={[10, 0, -50]} />
      <CrateStack position={[-10, 0, -52]} />

      {/* Furniture */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <KitchenCounter position={[4.5, 0, 4.5]} />

      {/* Trees — more spread */}
      <Tree position={[-12, 0, 8]} scale={1.2} />
      <Tree position={[14, 0, 10]} />
      <Tree position={[-20, 0, 15]} scale={1.3} />
      <Tree position={[22, 0, 12]} scale={0.9} />
      <Tree position={[-25, 0, -10]} scale={1.1} />
      <Tree position={[25, 0, -15]} />
      <Tree position={[-18, 0, -40]} scale={1.4} />
      <Tree position={[20, 0, -42]} scale={1.1} />
      <Tree position={[0, 0, -50]} />
      <Tree position={[-10, 0, 20]} scale={0.8} />
      <Tree position={[10, 0, 18]} scale={1.0} />
      <Tree position={[-30, 0, -20]} scale={1.5} />
      <Tree position={[30, 0, -25]} scale={1.2} />
      <Tree position={[-28, 0, -50]} scale={1.3} />
      <Tree position={[28, 0, -50]} scale={1.1} />

      {/* Lampposts */}
      <Lamppost position={[-8, 0, 6]} />
      <Lamppost position={[8, 0, 6]} />
      <Lamppost position={[-15, 0, -10]} />
      <Lamppost position={[15, 0, -10]} />
      <Lamppost position={[0, 0, -20]} />
      <Lamppost position={[-10, 0, -30]} />
      <Lamppost position={[10, 0, -30]} />
      <Lamppost position={[0, 0, -40]} />
      <Lamppost position={[-20, 0, -45]} />
      <Lamppost position={[20, 0, -50]} />

      {/* Barrels */}
      <Barrel position={[-7, 0, -6]} />
      <Barrel position={[9, 0, -10]} />
      <Barrel position={[-18, 0, -25]} />
      <Barrel position={[16, 0, -20]} />
      <Barrel position={[0, 0, -45]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.5} color="#c8d8ff" />
      <directionalLight position={[30, 35, -20]} intensity={1.5} color="#fff8e0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-65} shadow-bias={-0.0003} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.concrete} receiveShadow>
        <planeGeometry args={[82, 90]} />
      </mesh>

      {/* Perimeter walls */}
      <Wall position={[0, 1.5, -65]} size={[82, 3, 0.3]} material={mats.concrete} />
      <Wall position={[-40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[0, 1.5, 30]} size={[80, 3, 0.3]} material={mats.concrete} />

      {/* Warehouse structure */}
      <Wall position={[-15, 2, 18]} size={[16, 4, 0.2]} material={mats.brick} />
      <Wall position={[-23, 2, 13]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-7, 2, 13]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-15, 2, 8]} size={[16, 4, 0.2]} material={mats.brick} />

      {/* Shipping containers — more */}
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
      <Container position={[-18, 0, -55]} color="#996633" />
      <Container position={[32, 0, -10]} rotation={0.8} color="#cc3333" />

      {/* Cover walls */}
      <Wall position={[-12, 1.2, -8]} size={[4, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[8, 1.2, -5]} size={[0.2, 2.4, 5]} material={mats.concrete} />
      <Wall position={[-8, 1.2, -28]} size={[6, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[12, 1.2, -33]} size={[0.2, 2.4, 6]} material={mats.concrete} />
      <Wall position={[-15, 1.2, -40]} size={[5, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[0, 1.2, -48]} size={[4, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[22, 1.2, -12]} size={[0.2, 2.4, 4]} material={mats.concrete} />
      <Wall position={[-28, 1.2, -15]} size={[4, 2.4, 0.2]} material={mats.concrete} />

      {/* Vent ducts */}
      <VentDuct position={[-30, 0, -5]} rotation={0} length={6} />
      <VentDuct position={[25, 0, -20]} rotation={Math.PI / 2} length={5} />
      <VentDuct position={[-15, 0, -50]} rotation={0.3} length={4} />
      <VentDuct position={[10, 0, -55]} rotation={-0.2} length={5} />

      {/* Pipes */}
      <Pipe position={[-33, 0.5, -18]} length={8} />
      <Pipe position={[30, 0.5, -22]} length={6} />
      <Pipe position={[-25, 0.5, -45]} length={5} />
      <Pipe position={[15, 1, -30]} length={7} />

      {/* Barrels */}
      <Barrel position={[-3, 0, 5]} />
      <Barrel position={[5, 0, -8]} />
      <Barrel position={[-18, 0, -18]} />
      <Barrel position={[24, 0, -20]} />
      <Barrel position={[-14, 0, -42]} />
      <Barrel position={[8, 0, -52]} />
      <Barrel position={[-30, 0, 10]} />
      <Barrel position={[33, 0, 18]} />

      {/* Crate stacks */}
      <CrateStack position={[-8, 0, 0]} />
      <CrateStack position={[18, 0, -8]} />
      <CrateStack position={[-24, 0, -32]} />
      <CrateStack position={[8, 0, -25]} />
      <CrateStack position={[-18, 0, -52]} />
      <CrateStack position={[30, 0, -40]} />
      <CrateStack position={[0, 0, -15]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.35} color="#ffddaa" />
      <directionalLight position={[25, 30, -10]} intensity={1.2} color="#ffeedd" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={45} shadow-camera-bottom={-70} shadow-bias={-0.0003} />
      
      <Lamppost position={[-22, 0, 2]} />
      <Lamppost position={[22, 0, 2]} />
      <Lamppost position={[0, 0, -18]} />
      <Lamppost position={[-18, 0, -28]} />
      <Lamppost position={[18, 0, -28]} />
      <Lamppost position={[0, 0, -40]} />
      <Lamppost position={[-28, 0, -52]} />
      <Lamppost position={[28, 0, -52]} />
      <Lamppost position={[0, 0, 18]} />
      <Lamppost position={[-33, 0, -18]} />
      <Lamppost position={[33, 0, -18]} />
      
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.grass} receiveShadow>
        <planeGeometry args={[92, 105]} />
      </mesh>

      {/* Natural boundary */}
      <Wall position={[0, 0.6, -70]} size={[92, 1.2, 0.15]} material={mats.fence} />
      <Wall position={[-45, 0.6, -18]} size={[0.15, 1.2, 105]} material={mats.fence} />
      <Wall position={[45, 0.6, -18]} size={[0.15, 1.2, 105]} material={mats.fence} />
      <Wall position={[0, 0.6, 35]} size={[90, 1.2, 0.15]} material={mats.fence} />

      {/* Rock formations */}
      <Wall position={[-10, 0.8, -8]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[12, 0.8, -12]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-18, 0.8, -22]} size={[4, 1.6, 1.5]} material={mats.concrete} />
      <Wall position={[8, 0.8, -28]} size={[1.5, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-5, 0.8, -38]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[22, 0.8, -20]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-28, 0.8, -33]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[15, 0.8, -42]} size={[2, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-14, 0.8, -50]} size={[4, 1.6, 2]} material={mats.concrete} />
      <Wall position={[28, 0.8, -38]} size={[3, 1.6, 1.5]} material={mats.concrete} />
      <Wall position={[0, 0.8, -18]} size={[2.5, 1.6, 2.5]} material={mats.concrete} />
      <Wall position={[-33, 0.8, -12]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[33, 0.8, -10]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-20, 0.8, -58]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[20, 0.8, -55]} size={[2, 1.6, 3]} material={mats.concrete} />

      {/* Log walls */}
      <Wall position={[-8, 0.6, -20]} size={[5, 1.2, 0.3]} material={mats.crate} />
      <Wall position={[5, 0.6, -33]} size={[0.3, 1.2, 4]} material={mats.crate} />
      <Wall position={[-22, 0.6, -42]} size={[4, 1.2, 0.3]} material={mats.crate} />
      <Wall position={[20, 0.6, -30]} size={[5, 1.2, 0.3]} material={mats.crate} />

      {/* Dense trees */}
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
      <Tree position={[-8, 0, 22]} scale={1.0} />
      <Tree position={[12, 0, 25]} scale={1.2} />
      <Tree position={[-25, 0, -55]} scale={1.5} />
      <Tree position={[22, 0, -58]} scale={1.3} />
      <Tree position={[-38, 0, -55]} scale={1.4} />
      <Tree position={[38, 0, -55]} scale={1.2} />
      {/* Border trees */}
      {Array.from({ length: 24 }).map((_, i) => (
        <Tree key={`bt-${i}`} position={[
          i < 12 ? -42 + Math.random() * 4 : 40 + Math.random() * 4,
          0,
          -65 + (i % 12) * 8 + Math.random() * 3
        ]} scale={1.2 + Math.random() * 0.6} />
      ))}

      {/* Rocks */}
      <Rock position={[-6, 0, -10]} scale={1.5} />
      <Rock position={[8, 0, -8]} scale={1.2} />
      <Rock position={[-15, 0, -25]} scale={1.8} />
      <Rock position={[12, 0, -28]} />
      <Rock position={[-24, 0, -38]} scale={1.3} />
      <Rock position={[20, 0, -45]} scale={1.5} />
      <Rock position={[0, 0, -12]} scale={0.8} />
      <Rock position={[-30, 0, -8]} scale={1.4} />
      <Rock position={[35, 0, -22]} scale={1.1} />

      {/* Campsite */}
      <Campfire position={[0, 0, 5]} />
      <Tent position={[-4, 0, 8]} rotation={0.3} />
      <Tent position={[3, 0, 10]} rotation={-0.5} />
      <Barrel position={[2, 0, 4]} />
      <Barrel position={[-2, 0, 3]} />
      <CrateStack position={[5, 0, 5]} />

      <Campfire position={[-22, 0, -12]} />
      <Campfire position={[18, 0, -18]} />
      <Campfire position={[0, 0, -35]} />
      <Campfire position={[-15, 0, -55]} />

      <EscapeZone escapePos={escapePos} />

      <ambientLight intensity={0.4} color="#eeddcc" />
      <directionalLight position={[35, 25, 10]} intensity={1.3} color="#ffe8c0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-55} shadow-camera-right={55} shadow-camera-top={50} shadow-camera-bottom={-75} shadow-bias={-0.0003} />
      <hemisphereLight args={["#87CEEB", "#2a5420", 0.5]} />
      <fog attach="fog" args={["#aabbaa", 18, 80]} />
    </group>
  );
}

// ===== ARCTIC MAP =====
function ArcticMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      {/* Snow ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#dde8f0" roughness={0.3} />
      </mesh>

      {/* Ice wall perimeter */}
      <Wall position={[0, 1.5, -65]} size={[82, 3, 0.3]} material={mats.concrete} />
      <Wall position={[-40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[40, 1.5, -18]} size={[0.3, 3, 94]} material={mats.concrete} />
      <Wall position={[0, 1.5, 30]} size={[80, 3, 0.3]} material={mats.concrete} />

      {/* Ice walls for cover */}
      <Wall position={[-10, 1, -10]} size={[4, 2, 0.4]} material={mats.concrete} />
      <Wall position={[12, 1, -15]} size={[0.4, 2, 5]} material={mats.concrete} />
      <Wall position={[-18, 1, -25]} size={[5, 2, 0.4]} material={mats.concrete} />
      <Wall position={[8, 1, -20]} size={[4, 2, 0.4]} material={mats.concrete} />
      <Wall position={[-5, 1, -35]} size={[0.4, 2, 4]} material={mats.concrete} />
      <Wall position={[20, 1, -30]} size={[4, 2, 0.4]} material={mats.concrete} />
      <Wall position={[-25, 1, -40]} size={[3, 2, 0.4]} material={mats.concrete} />
      <Wall position={[15, 1, -45]} size={[0.4, 2, 5]} material={mats.concrete} />
      <Wall position={[-12, 1, -50]} size={[5, 2, 0.4]} material={mats.concrete} />
      <Wall position={[25, 1, -15]} size={[0.4, 2, 4]} material={mats.concrete} />
      <Wall position={[-30, 1, -20]} size={[4, 2, 0.4]} material={mats.concrete} />
      <Wall position={[0, 1, -28]} size={[3, 2, 3]} material={mats.concrete} />
      <Wall position={[30, 1, -40]} size={[0.4, 2, 5]} material={mats.concrete} />
      <Wall position={[-20, 1, -55]} size={[4, 2, 0.4]} material={mats.concrete} />

      {/* Igloos */}
      <Igloo position={[-15, 0, 10]} />
      <Igloo position={[18, 0, 15]} />
      <Igloo position={[-25, 0, -8]} />
      <Igloo position={[5, 0, -5]} />

      {/* Snow trees */}
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
      <SnowTree position={[-35, 0, -30]} scale={1.5} />
      <SnowTree position={[35, 0, -35]} scale={1.1} />
      {/* Border */}
      {Array.from({ length: 20 }).map((_, i) => (
        <SnowTree key={`sbt-${i}`} position={[
          i < 10 ? -38 + Math.random() * 3 : 37 + Math.random() * 3,
          0,
          -60 + (i % 10) * 9 + Math.random() * 3
        ]} scale={1.2 + Math.random() * 0.5} />
      ))}

      {/* Snowdrifts */}
      <Snowdrift position={[-5, 0, 0]} scale={1.5} />
      <Snowdrift position={[8, 0, -12]} scale={1.2} />
      <Snowdrift position={[-20, 0, -30]} scale={1.8} />
      <Snowdrift position={[15, 0, -20]} scale={1.0} />
      <Snowdrift position={[-10, 0, -42]} scale={1.4} />
      <Snowdrift position={[22, 0, -50]} scale={1.3} />
      <Snowdrift position={[0, 0, 15]} scale={2.0} />
      <Snowdrift position={[-30, 0, -50]} scale={1.6} />

      {/* Ice rocks */}
      <IceRock position={[-12, 0, -5]} scale={1.5} />
      <IceRock position={[15, 0, -8]} scale={1.2} />
      <IceRock position={[-22, 0, -35]} scale={1.8} />
      <IceRock position={[10, 0, -30]} scale={1.0} />
      <IceRock position={[-8, 0, -48]} scale={1.4} />
      <IceRock position={[28, 0, -22]} scale={1.1} />

      {/* Crates */}
      <CrateStack position={[-6, 0, 12]} />
      <CrateStack position={[12, 0, -18]} />
      <CrateStack position={[-18, 0, -38]} />
      <CrateStack position={[22, 0, -42]} />
      <CrateStack position={[0, 0, -48]} />

      <EscapeZone escapePos={escapePos} />

      {/* Cold blue-white lighting */}
      <ambientLight intensity={0.6} color="#dde8ff" />
      <directionalLight position={[30, 30, -15]} intensity={1.4} color="#eef4ff" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={45} shadow-camera-bottom={-70} shadow-bias={-0.0003} />
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
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.concrete} receiveShadow>
        <planeGeometry args={[72, 84]} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, -18]} receiveShadow>
        <planeGeometry args={[72, 84]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>

      {/* Perimeter walls (bunker walls) */}
      <Wall position={[0, 2, -60]} size={[72, 4, 0.5]} material={mats.concrete} />
      <Wall position={[-35, 2, -18]} size={[0.5, 4, 84]} material={mats.concrete} />
      <Wall position={[35, 2, -18]} size={[0.5, 4, 84]} material={mats.concrete} />
      <Wall position={[0, 2, 25]} size={[70, 4, 0.5]} material={mats.concrete} />

      {/* Tunnel corridors — walls creating passages */}
      <Wall position={[-15, 2, 10]} size={[0.4, 4, 12]} material={mats.brick} />
      <Wall position={[-15, 2, -10]} size={[0.4, 4, 12]} material={mats.brick} />
      <Wall position={[15, 2, 8]} size={[0.4, 4, 10]} material={mats.brick} />
      <Wall position={[15, 2, -12]} size={[0.4, 4, 14]} material={mats.brick} />
      
      {/* Cross corridors */}
      <Wall position={[-8, 2, -4]} size={[14, 4, 0.4]} material={mats.brick} />
      <Wall position={[8, 2, -5]} size={[14, 4, 0.4]} material={mats.brick} />
      <Wall position={[0, 2, -20]} size={[30, 4, 0.4]} material={mats.brick} />
      <Wall position={[-10, 2, -30]} size={[0.4, 4, 8]} material={mats.brick} />
      <Wall position={[10, 2, -32]} size={[0.4, 4, 10]} material={mats.brick} />
      <Wall position={[0, 2, -38]} size={[20, 4, 0.4]} material={mats.brick} />
      <Wall position={[-20, 2, -42]} size={[0.4, 4, 8]} material={mats.brick} />
      <Wall position={[20, 2, -44]} size={[0.4, 4, 10]} material={mats.brick} />
      <Wall position={[0, 2, -50]} size={[40, 4, 0.4]} material={mats.brick} />

      {/* Room dividers */}
      <Wall position={[-25, 2, 0]} size={[8, 4, 0.3]} material={mats.concrete} />
      <Wall position={[25, 2, -2]} size={[8, 4, 0.3]} material={mats.concrete} />
      <Wall position={[-25, 2, -25]} size={[0.3, 4, 6]} material={mats.concrete} />
      <Wall position={[25, 2, -28]} size={[0.3, 4, 8]} material={mats.concrete} />

      {/* Vent ducts — key feature */}
      <VentDuct position={[-5, 0, 15]} rotation={0} length={8} />
      <VentDuct position={[20, 0, 0]} rotation={Math.PI / 2} length={6} />
      <VentDuct position={[-20, 0, -15]} rotation={0} length={5} />
      <VentDuct position={[5, 0, -25]} rotation={Math.PI / 2} length={4} />
      <VentDuct position={[-25, 0, -35]} rotation={0.3} length={6} />
      <VentDuct position={[15, 0, -45]} rotation={-0.2} length={5} />
      <VentDuct position={[0, 0, -52]} rotation={Math.PI / 4} length={4} />
      <VentDuct position={[-12, 0, -48]} rotation={0} length={3} />

      {/* Overhead pipes */}
      <Pipe position={[-8, 3, -10]} length={12} />
      <Pipe position={[8, 3, -20]} length={10} />
      <Pipe position={[-20, 3, -35]} length={8} />
      <Pipe position={[12, 3, -42]} length={6} />
      <Pipe position={[0, 3, 5]} length={15} />

      {/* Barrels & crates */}
      <Barrel position={[-3, 0, 8]} />
      <Barrel position={[7, 0, -3]} />
      <Barrel position={[-22, 0, -8]} />
      <Barrel position={[22, 0, -10]} />
      <Barrel position={[-8, 0, -25]} />
      <Barrel position={[5, 0, -35]} />
      <Barrel position={[-28, 0, -45]} />
      <Barrel position={[28, 0, -48]} />
      <CrateStack position={[-12, 0, 5]} />
      <CrateStack position={[12, 0, 3]} />
      <CrateStack position={[-18, 0, -22]} />
      <CrateStack position={[18, 0, -25]} />
      <CrateStack position={[-5, 0, -42]} />
      <CrateStack position={[8, 0, -50]} />
      <CrateStack position={[-28, 0, 15]} />
      <CrateStack position={[28, 0, 12]} />

      <EscapeZone escapePos={escapePos} />

      {/* Dim underground lighting — lots of point lights */}
      <ambientLight intensity={0.25} color="#aabbcc" />
      <directionalLight position={[0, 10, -20]} intensity={0.3} color="#ddeeff" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={35} shadow-camera-bottom={-65} shadow-bias={-0.0003} />
      <hemisphereLight args={["#556677", "#222233", 0.3]} />
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
      {/* Dark volcanic ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} receiveShadow>
        <planeGeometry args={[82, 94]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
      </mesh>

      {/* Lava rivers */}
      <mesh ref={lavaRef} rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.05, -25]} receiveShadow>
        <planeGeometry args={[3, 40]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.05, -15]} receiveShadow>
        <planeGeometry args={[2.5, 30]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -50]}>
        <planeGeometry args={[20, 3]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff2200" emissiveIntensity={2.5} roughness={0.2} />
      </mesh>

      {/* Perimeter - obsidian walls */}
      <Wall position={[0, 2, -65]} size={[82, 4, 0.5]} material={mats.concrete} />
      <Wall position={[-40, 2, -18]} size={[0.5, 4, 94]} material={mats.concrete} />
      <Wall position={[40, 2, -18]} size={[0.5, 4, 94]} material={mats.concrete} />
      <Wall position={[0, 2, 30]} size={[80, 4, 0.5]} material={mats.concrete} />

      {/* Obsidian rock formations */}
      <Wall position={[-8, 1.2, -10]} size={[4, 2.4, 2]} material={mats.brick} />
      <Wall position={[10, 1.2, -15]} size={[2, 2.4, 4]} material={mats.brick} />
      <Wall position={[-22, 1.2, -20]} size={[5, 2.4, 1.5]} material={mats.brick} />
      <Wall position={[25, 1.2, -25]} size={[3, 2.4, 2]} material={mats.brick} />
      <Wall position={[-5, 1.2, -35]} size={[3, 2.4, 3]} material={mats.brick} />
      <Wall position={[12, 1.2, -40]} size={[2, 2.4, 4]} material={mats.brick} />
      <Wall position={[-28, 1.2, -42]} size={[4, 2.4, 2]} material={mats.brick} />
      <Wall position={[30, 1.2, -35]} size={[3, 2.4, 2]} material={mats.brick} />
      <Wall position={[-12, 1.2, -50]} size={[5, 2.4, 1.5]} material={mats.brick} />
      <Wall position={[20, 1.2, -50]} size={[2, 2.4, 3]} material={mats.brick} />
      <Wall position={[0, 1.2, -20]} size={[3, 2.4, 2]} material={mats.brick} />
      <Wall position={[-30, 1.2, -10]} size={[4, 2.4, 2]} material={mats.brick} />
      <Wall position={[30, 1.2, -8]} size={[3, 2.4, 3]} material={mats.brick} />

      {/* Volcanic rocks */}
      <Rock position={[-6, 0, -5]} scale={2.0} />
      <Rock position={[8, 0, -8]} scale={1.5} />
      <Rock position={[-20, 0, -30]} scale={2.2} />
      <Rock position={[15, 0, -22]} scale={1.8} />
      <Rock position={[-10, 0, -45]} scale={1.6} />
      <Rock position={[25, 0, -48]} scale={2.0} />
      <Rock position={[0, 0, 10]} scale={1.4} />
      <Rock position={[-35, 0, -20]} scale={1.9} />
      <Rock position={[35, 0, -30]} scale={1.7} />

      {/* Crates (heat-resistant) */}
      <CrateStack position={[-8, 0, 5]} />
      <CrateStack position={[12, 0, -18]} />
      <CrateStack position={[-22, 0, -38]} />
      <CrateStack position={[22, 0, -42]} />
      <CrateStack position={[0, 0, -28]} />
      <CrateStack position={[-30, 0, -50]} />
      <CrateStack position={[28, 0, -55]} />

      <Barrel position={[-3, 0, 8]} />
      <Barrel position={[7, 0, -3]} />
      <Barrel position={[-18, 0, -28]} />
      <Barrel position={[24, 0, -18]} />
      <Barrel position={[-8, 0, -42]} />
      <Barrel position={[5, 0, -55]} />

      <EscapeZone escapePos={escapePos} />

      {/* Hot volcanic lighting */}
      <ambientLight intensity={0.4} color="#ff8844" />
      <directionalLight position={[25, 30, -15]} intensity={0.8} color="#ffeedd" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={45} shadow-camera-bottom={-70} shadow-bias={-0.0003} />
      <hemisphereLight args={["#ff8844", "#331100", 0.4]} />
      <fog attach="fog" args={["#1a0800", 20, 80]} />
    </group>
  );
}

// ===== SPACE STATION MAP =====
function SpaceStationMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      {/* Metal floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} receiveShadow>
        <planeGeometry args={[72, 80]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, -15]} receiveShadow>
        <planeGeometry args={[72, 80]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Hull walls */}
      <Wall position={[0, 2.25, -55]} size={[72, 4.5, 0.5]} material={mats.concrete} />
      <Wall position={[-35, 2.25, -15]} size={[0.5, 4.5, 80]} material={mats.concrete} />
      <Wall position={[35, 2.25, -15]} size={[0.5, 4.5, 80]} material={mats.concrete} />
      <Wall position={[0, 2.25, 25]} size={[70, 4.5, 0.5]} material={mats.concrete} />

      {/* Corridor walls creating rooms */}
      <Wall position={[-12, 2.25, 10]} size={[0.3, 4.5, 14]} material={mats.concrete} />
      <Wall position={[12, 2.25, 8]} size={[0.3, 4.5, 10]} material={mats.concrete} />
      <Wall position={[-12, 2.25, -12]} size={[0.3, 4.5, 14]} material={mats.concrete} />
      <Wall position={[12, 2.25, -14]} size={[0.3, 4.5, 16]} material={mats.concrete} />
      
      {/* Cross corridors */}
      <Wall position={[0, 2.25, -5]} size={[24, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[-6, 2.25, -22]} size={[12, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[6, 2.25, -22]} size={[12, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[0, 2.25, -35]} size={[30, 4.5, 0.3]} material={mats.concrete} />
      <Wall position={[-20, 2.25, -40]} size={[0.3, 4.5, 10]} material={mats.concrete} />
      <Wall position={[20, 2.25, -42]} size={[0.3, 4.5, 12]} material={mats.concrete} />
      <Wall position={[0, 2.25, -48]} size={[40, 4.5, 0.3]} material={mats.concrete} />

      {/* Control panels (decorative boxes) */}
      {[[-8, 0, 15], [8, 0, 15], [-25, 0, 5], [25, 0, 3], [-8, 0, -30], [8, 0, -32]].map((pos, i) => (
        <group key={`panel-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[2, 1.2, 0.5]} />
            <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.9, 0.26]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshStandardMaterial color="#003366" emissive="#0066cc" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}

      {/* Airlock doors (decorative) */}
      {[[-12, 0, 3], [12, 0, 3], [-12, 0, -19], [12, 0, -19]].map((pos, i) => (
        <group key={`airlock-${i}`} position={pos as [number, number, number]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.1, 3, 2]} />
            <meshStandardMaterial color="#445566" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <boxGeometry args={[0.15, 0.2, 2.2]} />
            <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1} />
          </mesh>
        </group>
      ))}

      {/* Crates & supplies */}
      <CrateStack position={[-20, 0, 15]} />
      <CrateStack position={[20, 0, 12]} />
      <CrateStack position={[-25, 0, -18]} />
      <CrateStack position={[25, 0, -20]} />
      <CrateStack position={[-15, 0, -40]} />
      <CrateStack position={[15, 0, -42]} />
      <CrateStack position={[0, 0, -15]} />

      <Barrel position={[-5, 0, 8]} />
      <Barrel position={[5, 0, -10]} />
      <Barrel position={[-22, 0, -8]} />
      <Barrel position={[22, 0, -10]} />
      <Barrel position={[-8, 0, -38]} />
      <Barrel position={[8, 0, -45]} />

      {/* Pipes along ceiling */}
      <Pipe position={[-8, 3.5, -10]} length={12} />
      <Pipe position={[8, 3.5, -20]} length={10} />
      <Pipe position={[0, 3.5, 5]} length={15} />
      <Pipe position={[-20, 3.5, -35]} length={8} />
      <Pipe position={[20, 3.5, -38]} length={6} />

      <EscapeZone escapePos={escapePos} />

      {/* Sci-fi blue-white lighting */}
      <ambientLight intensity={0.3} color="#aabbdd" />
      <directionalLight position={[0, 12, -15]} intensity={0.4} color="#ddeeff" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={35} shadow-camera-bottom={-60} shadow-bias={-0.0003} />
      <hemisphereLight args={["#4466aa", "#111122", 0.4]} />
      <fog attach="fog" args={["#0a0a1a", 15, 60]} />
    </group>
  );
}

// ===== PLATFORM COMPONENT (for parkour / vertical gameplay) =====
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
    // Also add as wall collider for side collision
    const halfSize = size.map(s => s / 2);
    wallColliders.push({
      min: new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]),
      max: new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]),
    });
  }, [position, size]);

  return (
    <mesh position={position} castShadow receiveShadow>
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

// ===== PARKOUR PLATFORMS (added to all maps when in parkour/deathrun mode) =====
function ParkourPlatforms() {
  const { gameMode } = useGame();
  if (gameMode !== "parkour" && gameMode !== "deathrun") return null;

  return (
    <group>
      {/* Starting area platforms */}
      <Platform position={[3, 1.5, -5]} size={[4, 0.3, 4]} color="#44aa66" emissive="#22ff44" />
      <Platform position={[-4, 3, -10]} size={[3, 0.3, 3]} color="#4488aa" emissive="#22aaff" />
      <Platform position={[5, 3, -10]} size={[3, 0.3, 3]} color="#4488aa" emissive="#22aaff" />
      
      {/* Mid-section elevated bridges */}
      <Platform position={[0, 5, -18]} size={[5, 0.3, 2]} color="#8844aa" emissive="#aa44ff" />
      <Platform position={[-8, 5, -20]} size={[3, 0.3, 3]} color="#8844aa" emissive="#aa44ff" />
      <Platform position={[8, 5, -22]} size={[3, 0.3, 3]} color="#8844aa" emissive="#aa44ff" />
      
      {/* Stepping stones */}
      <Platform position={[-3, 6.5, -26]} size={[2, 0.3, 2]} color="#aa6644" emissive="#ff8844" />
      <Platform position={[3, 7, -28]} size={[2, 0.3, 2]} color="#aa6644" emissive="#ff8844" />
      <Platform position={[-2, 7.5, -32]} size={[2, 0.3, 2]} color="#aa6644" emissive="#ff8844" />
      
      {/* High section */}
      <Platform position={[10, 7, -30]} size={[4, 0.3, 4]} color="#44aa88" emissive="#22ffaa" />
      <Platform position={[0, 8, -36]} size={[6, 0.3, 3]} color="#aa4466" emissive="#ff4488" />
      <Platform position={[-5, 9, -40]} size={[4, 0.3, 4]} color="#44aaaa" emissive="#22ffff" />
      
      {/* Final approach */}
      <Platform position={[3, 10, -44]} size={[3, 0.3, 3]} color="#aaaa44" emissive="#ffff22" />
      <Platform position={[0, 11, -50]} size={[5, 0.3, 5]} color="#ffcc00" emissive="#ffdd44" />
      
      {/* Ramps */}
      <group position={[0, 0.75, -3]} rotation={[-0.3, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 0.2, 5]} />
          <meshStandardMaterial color="#667788" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>
      
      {/* Deathrun specific: narrow beams */}
      {gameMode === "deathrun" && (
        <>
          <Platform position={[0, 4, -14]} size={[1, 0.2, 6]} color="#ff4444" emissive="#ff2222" />
          <Platform position={[-5, 6, -24]} size={[1, 0.2, 4]} color="#ff4444" emissive="#ff2222" />
          <Platform position={[5, 8, -38]} size={[1, 0.2, 4]} color="#ff4444" emissive="#ff2222" />
        </>
      )}

      {/* Platform edge glow lights */}
      <pointLight position={[0, 6, -18]} color="#aa44ff" intensity={2} distance={8} />
      <pointLight position={[0, 9, -36]} color="#ff4488" intensity={2} distance={8} />
      <pointLight position={[0, 12, -50]} color="#ffdd44" intensity={3} distance={10} />
    </group>
  );
}

// ===== BLOCK HUNT PROPS (extra hiding spots) =====
function BlockHuntProps() {
  const { gameMode } = useGame();
  if (gameMode !== "blockhunt") return null;

  // Add extra crates, barrels, and rocks as hiding spots
  const positions: [number, number, number][] = [
    [-10, 0, -8], [12, 0, -12], [-5, 0, -20], [8, 0, -25],
    [-15, 0, -30], [15, 0, -35], [3, 0, -15], [-8, 0, -40],
    [20, 0, -10], [-20, 0, -22], [0, 0, -32], [10, 0, -45],
    [-12, 0, -48], [5, 0, 10], [-18, 0, 8],
  ];

  return (
    <group>
      {positions.map((pos, i) => {
        const type = i % 3;
        if (type === 0) return <Crate key={`bh-${i}`} position={pos} />;
        if (type === 1) return <Barrel key={`bh-${i}`} position={pos} />;
        return <Rock key={`bh-${i}`} position={pos} scale={0.8} />;
      })}
    </group>
  );
}

export default function House() {
  const { selectedMap, gameMode } = useGame();
  const map = selectedMap || "suburban";
  const escapePos = ESCAPE_POSITIONS[map];

  useMemo(() => {
    wallColliders.length = 0;
    registeredColliders.clear();
    platformColliders.length = 0;
  }, [map, gameMode]);

  return (
    <>
      {map === "suburban" && <SuburbanMap escapePos={escapePos} />}
      {map === "industrial" && <IndustrialMap escapePos={escapePos} />}
      {map === "forest" && <ForestMap escapePos={escapePos} />}
      {map === "arctic" && <ArcticMap escapePos={escapePos} />}
      {map === "underground" && <UndergroundMap escapePos={escapePos} />}
      {map === "volcano" && <VolcanoMap escapePos={escapePos} />}
      {map === "space_station" && <SpaceStationMap escapePos={escapePos} />}
      <ParkourPlatforms />
      <BlockHuntProps />
    </>
  );
}
