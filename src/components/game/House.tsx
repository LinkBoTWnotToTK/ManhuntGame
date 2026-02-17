import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useGame, GameMap, ESCAPE_POSITIONS } from "./GameState";
import { useFrame } from "@react-three/fiber";
import { createTexturedMaterials } from "./Textures";

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
  const mats = getMats();
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#1a5a1a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.8, 0]} castShadow>
        <coneGeometry args={[1.0, 2, 8]} />
        <meshStandardMaterial color="#1e6e1e" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Lamppost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 4, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffeeaa" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 4.2, 0]} color="#ffeedd" intensity={3} distance={15} decay={2} castShadow />
    </group>
  );
}

function Barrel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 1, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[0.36, 0.03, 8, 16]} />
        <meshStandardMaterial color="#666" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
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

function Campfire({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(clock.elapsedTime * 8) * 1.5 + Math.sin(clock.elapsedTime * 13) * 0.5;
    }
  });
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, 0.15, Math.sin(a) * 0.3]} rotation={[Math.random(), Math.random(), Math.random()]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
            <meshStandardMaterial color="#4a2a0a" roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.5, 0]} color="#ff6622" intensity={4} distance={12} decay={2} castShadow />
    </group>
  );
}

function Tent({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.8, 2, 4]} />
        <meshStandardMaterial color="#cc8844" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
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
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!escapeOpen) return;
    const t = state.clock.elapsedTime;
    if (ref.current) { ref.current.rotation.y = t * 0.8; ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08); }
    if (ringRef.current) ringRef.current.rotation.z = t * 1.5;
  });

  return (
    <group position={escapePos}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 3.5, 0.3]} />
        <meshStandardMaterial color={escapeOpen ? "#003300" : "#330000"} roughness={0.5} />
      </mesh>
      <mesh ref={ref} position={[0, 1.5, 0]} material={escapeOpen ? mats.escapeOpen : mats.escapeClosed}>
        <boxGeometry args={[2.8, 2.8, 0.15]} />
      </mesh>
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

export const ESCAPE_ZONE_RADIUS = 2.5;

// ===== MAPS =====
function SuburbanMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  const WH = 2.8, WT = 0.15;
  return (
    <group>
      {/* Indoor floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor} receiveShadow><planeGeometry args={[12, 10]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WH, 0]} material={mats.ceiling} receiveShadow><planeGeometry args={[12, 10]} /></mesh>
      
      {/* Outdoor ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]} material={mats.grass} receiveShadow><planeGeometry args={[62, 50]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 15]} material={mats.grass} receiveShadow><planeGeometry args={[62, 20]} /></mesh>

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
      
      {/* Perimeter fence */}
      <Wall position={[0, 0.6, -50]} size={[62, 1.2, WT]} material={mats.fence} />
      <Wall position={[-30, 0.6, -14]} size={[WT, 1.2, 72]} material={mats.fence} />
      <Wall position={[30, 0.6, -14]} size={[WT, 1.2, 72]} material={mats.fence} />
      <Wall position={[0, 0.6, 25]} size={[60, 1.2, WT]} material={mats.fence} />

      {/* Outdoor cover walls */}
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

      {/* Furniture */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <KitchenCounter position={[4.5, 0, 4.5]} />

      {/* Trees */}
      <Tree position={[-12, 0, 8]} scale={1.2} />
      <Tree position={[14, 0, 10]} />
      <Tree position={[-20, 0, 15]} scale={1.3} />
      <Tree position={[22, 0, 12]} scale={0.9} />
      <Tree position={[-25, 0, -10]} scale={1.1} />
      <Tree position={[25, 0, -15]} />
      <Tree position={[-18, 0, -40]} scale={1.4} />
      <Tree position={[20, 0, -42]} scale={1.1} />
      <Tree position={[0, 0, -47]} />
      <Tree position={[-10, 0, 20]} scale={0.8} />
      <Tree position={[10, 0, 18]} scale={1.0} />

      {/* Lampposts */}
      <Lamppost position={[-8, 0, 6]} />
      <Lamppost position={[8, 0, 6]} />
      <Lamppost position={[-15, 0, -10]} />
      <Lamppost position={[15, 0, -10]} />
      <Lamppost position={[0, 0, -20]} />
      <Lamppost position={[-10, 0, -30]} />
      <Lamppost position={[10, 0, -30]} />
      <Lamppost position={[0, 0, -40]} />

      {/* Barrels */}
      <Barrel position={[-7, 0, -6]} />
      <Barrel position={[9, 0, -10]} />
      <Barrel position={[-18, 0, -25]} />
      <Barrel position={[16, 0, -20]} />

      <EscapeZone escapePos={escapePos} />

      {/* Bright daylight lighting */}
      <ambientLight intensity={0.5} color="#c8d8ff" />
      <directionalLight position={[30, 35, -20]} intensity={1.5} color="#fff8e0" castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096}
        shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-55} shadow-bias={-0.0003} />
      <directionalLight position={[-15, 10, 10]} intensity={0.4} color="#aabbdd" />
      
      {/* Indoor lights */}
      <pointLight position={[-3, 2.5, 3]} intensity={1.5} color="#ffe0a0" distance={10} decay={2} castShadow />
      <pointLight position={[3, 2.5, 3]} intensity={1.0} color="#fff0d0" distance={10} decay={2} />
      <pointLight position={[4, 2.5, -3.5]} intensity={0.7} color="#ffd080" distance={8} decay={2} />

      {/* Sky color */}
      <hemisphereLight args={["#87CEEB", "#4a7a3a", 0.4]} />
      <fog attach="fog" args={["#c8d8ff", 20, 75]} />
    </group>
  );
}

function IndustrialMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} material={mats.concrete} receiveShadow>
        <planeGeometry args={[72, 80]} />
      </mesh>

      {/* Perimeter walls */}
      <Wall position={[0, 1.5, -55]} size={[72, 3, 0.3]} material={mats.concrete} />
      <Wall position={[-35, 1.5, -15]} size={[0.3, 3, 80]} material={mats.concrete} />
      <Wall position={[35, 1.5, -15]} size={[0.3, 3, 80]} material={mats.concrete} />
      <Wall position={[0, 1.5, 25]} size={[70, 3, 0.3]} material={mats.concrete} />

      {/* Warehouse structure */}
      <Wall position={[-15, 2, 15]} size={[16, 4, 0.2]} material={mats.brick} />
      <Wall position={[-23, 2, 10]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-7, 2, 10]} size={[0.2, 4, 10]} material={mats.brick} />
      <Wall position={[-15, 2, 5]} size={[16, 4, 0.2]} material={mats.brick} />

      {/* Shipping containers */}
      <Container position={[10, 0, 10]} color="#cc3333" />
      <Container position={[10, 0, 16]} color="#3366cc" />
      <Container position={[20, 0, 5]} rotation={Math.PI / 2} color="#cc8833" />
      <Container position={[-5, 0, -10]} color="#339933" />
      <Container position={[15, 0, -15]} rotation={0.3} color="#cc3333" />
      <Container position={[-20, 0, -20]} rotation={-0.2} color="#3366cc" />
      <Container position={[25, 0, -25]} color="#996633" />
      <Container position={[-10, 0, -30]} rotation={Math.PI / 4} color="#cc8833" />
      <Container position={[5, 0, -35]} color="#cc3333" />
      <Container position={[-25, 0, -40]} rotation={0.5} color="#339933" />
      <Container position={[20, 0, -42]} rotation={-0.3} color="#3366cc" />

      {/* Walls for cover */}
      <Wall position={[-12, 1.2, -8]} size={[4, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[8, 1.2, -5]} size={[0.2, 2.4, 5]} material={mats.concrete} />
      <Wall position={[-8, 1.2, -25]} size={[6, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[12, 1.2, -30]} size={[0.2, 2.4, 6]} material={mats.concrete} />
      <Wall position={[-15, 1.2, -35]} size={[5, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[0, 1.2, -42]} size={[4, 2.4, 0.2]} material={mats.concrete} />
      <Wall position={[20, 1.2, -10]} size={[0.2, 2.4, 4]} material={mats.concrete} />
      <Wall position={[-25, 1.2, -12]} size={[4, 2.4, 0.2]} material={mats.concrete} />

      {/* Pipes */}
      <Pipe position={[-30, 0.5, -15]} length={8} />
      <Pipe position={[28, 0.5, -20]} length={6} />
      <Pipe position={[-22, 0.5, -38]} length={5} />

      {/* Barrels scattered */}
      <Barrel position={[-3, 0, 5]} />
      <Barrel position={[5, 0, -8]} />
      <Barrel position={[-18, 0, -15]} />
      <Barrel position={[22, 0, -18]} />
      <Barrel position={[-12, 0, -38]} />
      <Barrel position={[8, 0, -45]} />
      <Barrel position={[-28, 0, 8]} />
      <Barrel position={[30, 0, 15]} />

      {/* Crate stacks */}
      <CrateStack position={[-8, 0, 0]} />
      <CrateStack position={[18, 0, -8]} />
      <CrateStack position={[-22, 0, -28]} />
      <CrateStack position={[8, 0, -22]} />
      <CrateStack position={[-15, 0, -45]} />
      <CrateStack position={[28, 0, -35]} />

      <EscapeZone escapePos={escapePos} />

      {/* Industrial orange/sodium lighting */}
      <ambientLight intensity={0.35} color="#ffddaa" />
      <directionalLight position={[25, 30, -10]} intensity={1.2} color="#ffeedd" castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096}
        shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={40} shadow-camera-bottom={-60} shadow-bias={-0.0003} />
      
      {/* Sodium vapor lights */}
      <Lamppost position={[-20, 0, 0]} />
      <Lamppost position={[20, 0, 0]} />
      <Lamppost position={[0, 0, -15]} />
      <Lamppost position={[-15, 0, -25]} />
      <Lamppost position={[15, 0, -25]} />
      <Lamppost position={[0, 0, -35]} />
      <Lamppost position={[-25, 0, -45]} />
      <Lamppost position={[25, 0, -45]} />
      <Lamppost position={[0, 0, 15]} />
      <Lamppost position={[-30, 0, -15]} />
      <Lamppost position={[30, 0, -15]} />
      
      <hemisphereLight args={["#ffddaa", "#554433", 0.3]} />
      <fog attach="fog" args={["#332211", 25, 80]} />
    </group>
  );
}

function ForestMap({ escapePos }: { escapePos: [number, number, number] }) {
  const mats = getMats();
  return (
    <group>
      {/* Grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]} material={mats.grass} receiveShadow>
        <planeGeometry args={[82, 90]} />
      </mesh>

      {/* Natural boundary - dense trees (no fence) */}
      <Wall position={[0, 0.6, -60]} size={[82, 1.2, 0.15]} material={mats.fence} />
      <Wall position={[-40, 0.6, -15]} size={[0.15, 1.2, 90]} material={mats.fence} />
      <Wall position={[40, 0.6, -15]} size={[0.15, 1.2, 90]} material={mats.fence} />
      <Wall position={[0, 0.6, 30]} size={[80, 1.2, 0.15]} material={mats.fence} />

      {/* Rock formations as cover */}
      <Wall position={[-10, 0.8, -8]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[12, 0.8, -12]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-18, 0.8, -20]} size={[4, 1.6, 1.5]} material={mats.concrete} />
      <Wall position={[8, 0.8, -25]} size={[1.5, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-5, 0.8, -35]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[20, 0.8, -18]} size={[2, 1.6, 3]} material={mats.concrete} />
      <Wall position={[-25, 0.8, -30]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[15, 0.8, -38]} size={[2, 1.6, 4]} material={mats.concrete} />
      <Wall position={[-12, 0.8, -45]} size={[4, 1.6, 2]} material={mats.concrete} />
      <Wall position={[25, 0.8, -35]} size={[3, 1.6, 1.5]} material={mats.concrete} />
      <Wall position={[0, 0.8, -15]} size={[2.5, 1.6, 2.5]} material={mats.concrete} />
      <Wall position={[-30, 0.8, -10]} size={[3, 1.6, 2]} material={mats.concrete} />
      <Wall position={[30, 0.8, -8]} size={[2, 1.6, 3]} material={mats.concrete} />

      {/* Log walls */}
      <Wall position={[-8, 0.6, -18]} size={[5, 1.2, 0.3]} material={mats.crate} />
      <Wall position={[5, 0.6, -30]} size={[0.3, 1.2, 4]} material={mats.crate} />
      <Wall position={[-20, 0.6, -38]} size={[4, 1.2, 0.3]} material={mats.crate} />
      <Wall position={[18, 0.6, -28]} size={[5, 1.2, 0.3]} material={mats.crate} />

      {/* Dense trees everywhere */}
      <Tree position={[-8, 0, 5]} scale={1.3} />
      <Tree position={[10, 0, 8]} scale={1.1} />
      <Tree position={[-20, 0, 12]} scale={1.5} />
      <Tree position={[22, 0, 15]} />
      <Tree position={[-30, 0, 5]} scale={1.4} />
      <Tree position={[28, 0, 3]} scale={1.2} />
      <Tree position={[-15, 0, -5]} />
      <Tree position={[18, 0, -3]} scale={1.3} />
      <Tree position={[-25, 0, -15]} scale={1.6} />
      <Tree position={[25, 0, -12]} scale={1.1} />
      <Tree position={[-5, 0, -22]} scale={1.2} />
      <Tree position={[15, 0, -20]} scale={1.4} />
      <Tree position={[-18, 0, -28]} />
      <Tree position={[22, 0, -30]} scale={1.3} />
      <Tree position={[-30, 0, -35]} scale={1.5} />
      <Tree position={[30, 0, -38]} scale={1.1} />
      <Tree position={[-12, 0, -40]} />
      <Tree position={[10, 0, -42]} scale={1.4} />
      <Tree position={[0, 0, -50]} scale={1.6} />
      <Tree position={[-35, 0, 20]} scale={1.7} />
      <Tree position={[35, 0, 18]} scale={1.3} />
      <Tree position={[-8, 0, 20]} scale={1.0} />
      <Tree position={[12, 0, 22]} scale={1.2} />
      <Tree position={[-22, 0, -50]} scale={1.5} />
      <Tree position={[20, 0, -50]} scale={1.3} />
      {/* Border trees */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Tree key={`bt-${i}`} position={[
          i < 10 ? -38 + Math.random() * 4 : 36 + Math.random() * 4,
          0,
          -55 + (i % 10) * 9 + Math.random() * 3
        ]} scale={1.2 + Math.random() * 0.6} />
      ))}

      {/* Rocks */}
      <Rock position={[-6, 0, -10]} scale={1.5} />
      <Rock position={[8, 0, -8]} scale={1.2} />
      <Rock position={[-15, 0, -22]} scale={1.8} />
      <Rock position={[12, 0, -25]} />
      <Rock position={[-22, 0, -35]} scale={1.3} />
      <Rock position={[18, 0, -40]} scale={1.5} />
      <Rock position={[0, 0, -10]} scale={0.8} />
      <Rock position={[-28, 0, -5]} scale={1.4} />
      <Rock position={[32, 0, -20]} scale={1.1} />

      {/* Campsite */}
      <Campfire position={[0, 0, 5]} />
      <Tent position={[-4, 0, 8]} rotation={0.3} />
      <Tent position={[3, 0, 9]} rotation={-0.5} />
      <Barrel position={[2, 0, 4]} />
      <Barrel position={[-2, 0, 3]} />
      <CrateStack position={[5, 0, 5]} />

      {/* More campfires for light */}
      <Campfire position={[-20, 0, -10]} />
      <Campfire position={[15, 0, -15]} />
      <Campfire position={[0, 0, -30]} />

      <EscapeZone escapePos={escapePos} />

      {/* Natural lighting — warm golden hour */}
      <ambientLight intensity={0.4} color="#eeddcc" />
      <directionalLight position={[35, 25, 10]} intensity={1.3} color="#ffe8c0" castShadow
        shadow-mapSize-width={4096} shadow-mapSize-height={4096}
        shadow-camera-left={-50} shadow-camera-right={50} shadow-camera-top={45} shadow-camera-bottom={-65} shadow-bias={-0.0003} />
      <directionalLight position={[-20, 15, -10]} intensity={0.3} color="#aaddff" />
      
      <hemisphereLight args={["#87CEEB", "#2a5420", 0.5]} />
      <fog attach="fog" args={["#aabbaa", 15, 70]} />
    </group>
  );
}

export default function House() {
  const { selectedMap } = useGame();
  const map = selectedMap || "suburban";
  const escapePos = ESCAPE_POSITIONS[map];

  // Clear colliders when map changes
  useMemo(() => {
    wallColliders.length = 0;
    registeredColliders.clear();
  }, [map]);

  return (
    <>
      {map === "suburban" && <SuburbanMap escapePos={escapePos} />}
      {map === "industrial" && <IndustrialMap escapePos={escapePos} />}
      {map === "forest" && <ForestMap escapePos={escapePos} />}
    </>
  );
}
