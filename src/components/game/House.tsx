import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useGame } from "./GameState";
import { useFrame } from "@react-three/fiber";
import { createTexturedMaterials } from "./Textures";

// Singleton materials with textures
let _mats: ReturnType<typeof createTexturedMaterials> | null = null;
function getMats() {
  if (!_mats) _mats = createTexturedMaterials();
  return _mats;
}

export const wallColliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = [];
wallColliders.length = 0;

function Wall({ position, size, material: mat }: { position: [number, number, number]; size: [number, number, number]; material?: THREE.MeshStandardMaterial }) {
  const mats = getMats();
  const usedMat = mat || mats.wall;
  const halfSize = size.map(s => s / 2);
  const min = new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]);
  const max = new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]);
  const exists = wallColliders.some(c => c.min.equals(min) && c.max.equals(max));
  if (!exists) wallColliders.push({ min, max });

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

function EscapeZone() {
  const { escapeOpen } = useGame();
  const mats = getMats();
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
    <group position={[0, 0, -32]}>
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

export const ESCAPE_ZONE_POS = new THREE.Vector3(0, 0, -32);
export const ESCAPE_ZONE_RADIUS = 2.5;

export default function House() {
  const WH = 2.8;
  const WT = 0.15;
  const mats = getMats();

  return (
    <group>
      {/* ===== INDOOR FLOOR + CEILING ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor} receiveShadow>
        <planeGeometry args={[12, 10]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WH, 0]} material={mats.ceiling} receiveShadow>
        <planeGeometry args={[12, 10]} />
      </mesh>

      {/* ===== OUTDOOR GROUND (expanded) ===== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -18]} material={mats.grass} receiveShadow>
        <planeGeometry args={[50, 40]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 15]} material={mats.grass} receiveShadow>
        <planeGeometry args={[50, 20]} />
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

      {/* ===== PERIMETER FENCE (expanded) ===== */}
      <Wall position={[0, 0.6, -38]} size={[50, 1.2, WT]} material={mats.fence} />
      <Wall position={[-24, 0.6, -10]} size={[WT, 1.2, 56]} material={mats.fence} />
      <Wall position={[24, 0.6, -10]} size={[WT, 1.2, 56]} material={mats.fence} />
      <Wall position={[0, 0.6, 20]} size={[48, 1.2, WT]} material={mats.fence} />

      {/* ===== OUTDOOR COVER — ZONE A: near house ===== */}
      <Wall position={[-8, 1, -10]} size={[4, 2, WT]} material={mats.concrete} />
      <Wall position={[-8, 1, -10]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[8, 1, -12]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[8, 1, -14.5]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-5, 1, -16]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-5, 1, -18]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[5, 1, -8]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[5, 1, -8]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[-10, 1, -7]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-10, 1, -7]} size={[WT, 2, 2]} material={mats.concrete} />

      {/* L-shaped covers */}
      <Wall position={[-2, 1, -12]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-3.5, 1, -13]} size={[WT, 2, 2]} material={mats.brick} />
      <Wall position={[11, 1, -7]} size={[2, 2, WT]} material={mats.brick} />
      <Wall position={[12, 1, -8]} size={[WT, 2, 2]} material={mats.brick} />
      <Wall position={[-12, 1, -15]} size={[2, 2, WT]} material={mats.brick} />
      <Wall position={[-12, 1, -16]} size={[WT, 2, 2]} material={mats.brick} />

      {/* ===== ZONE B: mid-field expanded area ===== */}
      <Wall position={[15, 1, -15]} size={[4, 2, WT]} material={mats.concrete} />
      <Wall position={[15, 1, -15]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[-15, 1, -12]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[-15, 1, -14.5]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[18, 1, -22]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[19.5, 1, -23]} size={[WT, 2, 2]} material={mats.brick} />
      <Wall position={[-18, 1, -20]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[-20, 1, -21]} size={[WT, 2, 2]} material={mats.brick} />
      <Wall position={[10, 1, -18]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[10, 1, -20]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-8, 1, -20]} size={[5, 2, WT]} material={mats.concrete} />
      <Wall position={[3, 1, -15]} size={[WT, 2, 5]} material={mats.concrete} />
      <Wall position={[3, 1, -17.5]} size={[3, 2, WT]} material={mats.concrete} />

      {/* ===== ZONE C: far field near escape portal ===== */}
      <Wall position={[-4, 1, -28]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-5.5, 1, -29]} size={[WT, 2, 2]} material={mats.concrete} />
      <Wall position={[4, 1, -28]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[5.5, 1, -29]} size={[WT, 2, 2]} material={mats.concrete} />
      <Wall position={[-8, 1, -33]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[8, 1, -33]} size={[4, 2, WT]} material={mats.brick} />
      <Wall position={[-2, 1, -30]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[2, 1, -30]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[12, 1, -28]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-12, 1, -28]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[15, 1, -30]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-15, 1, -30]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-20, 1, -32]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[20, 1, -32]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[-20, 1, -34]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[20, 1, -34]} size={[3, 2, WT]} material={mats.concrete} />

      {/* ===== FRONT YARD expanded ===== */}
      <Wall position={[-6, 1, 8]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-6, 1, 8]} size={[WT, 2, 2]} material={mats.concrete} />
      <Wall position={[7, 1, 10]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[7, 1, 12]} size={[2, 2, WT]} material={mats.concrete} />
      <Wall position={[-10, 1, 11]} size={[2, 2, WT]} material={mats.brick} />
      <Wall position={[3, 1, 9]} size={[2, 2, WT]} material={mats.brick} />
      <Wall position={[-15, 1, 12]} size={[3, 2, WT]} material={mats.concrete} />
      <Wall position={[-15, 1, 12]} size={[WT, 2, 3]} material={mats.concrete} />
      <Wall position={[15, 1, 14]} size={[WT, 2, 4]} material={mats.concrete} />
      <Wall position={[15, 1, 16]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[-20, 1, 8]} size={[3, 2, WT]} material={mats.brick} />
      <Wall position={[20, 1, 10]} size={[WT, 2, 3]} material={mats.brick} />

      {/* ===== CRATE CLUSTERS (more, spread wider) ===== */}
      <CrateStack position={[-3, 0, -8]} />
      <CrateStack position={[7, 0, -15]} />
      <CrateStack position={[-11, 0, -14]} />
      <CrateStack position={[12, 0, -8]} />
      <CrateStack position={[-7, 0, 8]} />
      <CrateStack position={[9, 0, 12]} />
      <CrateStack position={[-18, 0, -18]} />
      <CrateStack position={[16, 0, -25]} />
      <CrateStack position={[-14, 0, -30]} />
      <CrateStack position={[14, 0, -32]} />
      <CrateStack position={[20, 0, -10]} />
      <CrateStack position={[-20, 0, -8]} />
      <CrateStack position={[0, 0, -25]} />
      <CrateStack position={[-22, 0, 5]} />
      <CrateStack position={[18, 0, 8]} />
      <Crate position={[0, 0, -9]} />
      <Crate position={[-6, 0, -13]} />
      <Crate position={[6, 0, -19]} />
      <Crate position={[-9, 0, -5]} />
      <Crate position={[11, 0, -15]} />
      <Crate position={[-16, 0, -25]} />
      <Crate position={[18, 0, -18]} />
      <Crate position={[0, 0, -35]} />
      <Crate position={[-10, 0, -35]} />
      <Crate position={[10, 0, -35]} />

      {/* ===== FURNITURE ===== */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <KitchenCounter position={[4.5, 0, 4.5]} />

      {/* ===== ESCAPE ZONE ===== */}
      <EscapeZone />

      {/* ===== LIGHTING — cinematic moonlit scene ===== */}
      <ambientLight intensity={0.08} color="#1a1a3a" />
      
      <directionalLight 
        position={[20, 25, -15]} 
        intensity={0.7} 
        color="#8899bb" 
        castShadow 
        shadow-mapSize-width={4096} 
        shadow-mapSize-height={4096}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0003}
      />
      
      <directionalLight position={[-10, 8, 5]} intensity={0.15} color="#ffd4a0" />

      {/* Indoor warm lighting */}
      <pointLight position={[-3, 2.5, 3]} intensity={1.0} color="#ffe0a0" distance={8} decay={2} castShadow />
      <pointLight position={[3, 2.5, 3]} intensity={0.7} color="#fff0d0" distance={8} decay={2} />
      <pointLight position={[4, 2.5, -3.5]} intensity={0.5} color="#ffd080" distance={6} decay={2} />

      {/* Outdoor — deep blue moonlit atmosphere (wider coverage) */}
      <pointLight position={[0, 8, -10]} intensity={0.8} color="#4466aa" distance={35} decay={2} />
      <pointLight position={[-15, 6, -20]} intensity={0.5} color="#4466aa" distance={30} decay={2} />
      <pointLight position={[15, 6, -20]} intensity={0.5} color="#4466aa" distance={30} decay={2} />
      <pointLight position={[0, 6, 10]} intensity={0.5} color="#4466aa" distance={30} decay={2} />
      <pointLight position={[-20, 4, -5]} intensity={0.3} color="#334488" distance={25} decay={2} />
      <pointLight position={[20, 4, -5]} intensity={0.3} color="#334488" distance={25} decay={2} />
      <pointLight position={[0, 6, -30]} intensity={0.6} color="#4466aa" distance={30} decay={2} />
      <pointLight position={[-15, 5, -32]} intensity={0.3} color="#334488" distance={20} decay={2} />
      <pointLight position={[15, 5, -32]} intensity={0.3} color="#334488" distance={20} decay={2} />
      
      <spotLight position={[0, 12, -32]} angle={0.4} penumbra={0.8} intensity={0.5} color="#223366" distance={25} />

      <fog attach="fog" args={["#060812", 5, 50]} />
    </group>
  );
}
