import { useRef } from "react";
import * as THREE from "three";

const wallMaterial = new THREE.MeshStandardMaterial({ color: "#e8e0d4", roughness: 0.9 });
const floorMaterial = new THREE.MeshStandardMaterial({ color: "#8B7355", roughness: 0.8 });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: "#f5f0e8", roughness: 1 });
const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: "#5c3a1e", roughness: 0.7 });
const fabricMaterial = new THREE.MeshStandardMaterial({ color: "#6b4c3b", roughness: 0.95 });
const cushionMaterial = new THREE.MeshStandardMaterial({ color: "#c4573a", roughness: 0.9 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#888", metalness: 0.8, roughness: 0.3 });
const counterMaterial = new THREE.MeshStandardMaterial({ color: "#d4cfc7", roughness: 0.4, metalness: 0.1 });
const bedMaterial = new THREE.MeshStandardMaterial({ color: "#4a6b8a", roughness: 0.9 });
const pillowMaterial = new THREE.MeshStandardMaterial({ color: "#f0ece4", roughness: 1 });
const rugMaterial = new THREE.MeshStandardMaterial({ color: "#8b3a3a", roughness: 1 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: "#aaddff", transparent: true, opacity: 0.3, roughness: 0.1 });
const frameMaterial = new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.6 });
const paintingMaterial1 = new THREE.MeshStandardMaterial({ color: "#2a5a3a", roughness: 0.9 });
const paintingMaterial2 = new THREE.MeshStandardMaterial({ color: "#5a3a6a", roughness: 0.9 });
const bookMaterials = [
  new THREE.MeshStandardMaterial({ color: "#8b2500", roughness: 0.8 }),
  new THREE.MeshStandardMaterial({ color: "#2e4a2e", roughness: 0.8 }),
  new THREE.MeshStandardMaterial({ color: "#2b3d5b", roughness: 0.8 }),
];
const plantPotMaterial = new THREE.MeshStandardMaterial({ color: "#a0522d", roughness: 0.8 });
const plantMaterial = new THREE.MeshStandardMaterial({ color: "#3a7a3a", roughness: 0.9 });
const tileMaterial = new THREE.MeshStandardMaterial({ color: "#d0ccc4", roughness: 0.3 });
const bathroomWallMaterial = new THREE.MeshStandardMaterial({ color: "#e8e4dc", roughness: 0.5 });
const porcelainMaterial = new THREE.MeshStandardMaterial({ color: "#f8f8f0", roughness: 0.2, metalness: 0.05 });

// Collision boxes for the player - exported for use by movement system
export const wallColliders: { min: THREE.Vector3; max: THREE.Vector3 }[] = [];

function Wall({ position, size, material = wallMaterial }: { position: [number, number, number]; size: [number, number, number]; material?: THREE.MeshStandardMaterial }) {
  const ref = useRef<THREE.Mesh>(null);
  
  // Register collider
  const halfSize = size.map(s => s / 2);
  const min = new THREE.Vector3(position[0] - halfSize[0], position[1] - halfSize[1], position[2] - halfSize[2]);
  const max = new THREE.Vector3(position[0] + halfSize[0], position[1] + halfSize[1], position[2] + halfSize[2]);
  
  const exists = wallColliders.some(c => c.min.equals(min) && c.max.equals(max));
  if (!exists) {
    wallColliders.push({ min, max });
  }

  return (
    <mesh ref={ref} position={position} material={material} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} material={fabricMaterial} castShadow>
        <boxGeometry args={[2, 0.5, 0.9]} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.35]} material={fabricMaterial} castShadow>
        <boxGeometry args={[2, 0.5, 0.2]} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.95, 0.45, 0]} material={fabricMaterial} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.9]} />
      </mesh>
      <mesh position={[0.95, 0.45, 0]} material={fabricMaterial} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.9]} />
      </mesh>
      {/* Cushions */}
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

function DiningTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[1.8, 0.06, 1]} />
      </mesh>
      {[[-0.75, 0.35, -0.4], [0.75, 0.35, -0.4], [-0.75, 0.35, 0.4], [0.75, 0.35, 0.4]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={darkWoodMaterial} castShadow>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
      </mesh>
      <mesh position={[0, 0.7, -0.18]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[0.4, 0.6, 0.04]} />
      </mesh>
      {[[-0.16, 0.2, -0.16], [0.16, 0.2, -0.16], [-0.16, 0.2, 0.16], [0.16, 0.2, 0.16]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} material={darkWoodMaterial} castShadow>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

function Bed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0.2, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[2, 0.4, 2.2]} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, 0.5, 0.05]} material={bedMaterial} castShadow>
        <boxGeometry args={[1.9, 0.2, 2]} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.8, -1.05]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[2, 0.8, 0.08]} />
      </mesh>
      {/* Pillows */}
      <mesh position={[-0.4, 0.68, -0.7]} material={pillowMaterial} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.35]} />
      </mesh>
      <mesh position={[0.4, 0.68, -0.7]} material={pillowMaterial} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.35]} />
      </mesh>
    </group>
  );
}

function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh position={[0, 1, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[1.2, 2, 0.3]} />
      </mesh>
      {/* Shelves */}
      {[0.4, 0.9, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]} material={darkWoodMaterial} castShadow>
          <boxGeometry args={[1.1, 0.04, 0.28]} />
        </mesh>
      ))}
      {/* Books */}
      {bookMaterials.map((mat, i) => (
        <mesh key={`book-${i}`} position={[-0.3 + i * 0.25, 0.6, 0.02]} material={mat} castShadow>
          <boxGeometry args={[0.12, 0.3, 0.2]} />
        </mesh>
      ))}
      {bookMaterials.map((mat, i) => (
        <mesh key={`book2-${i}`} position={[-0.2 + i * 0.25, 1.1, 0.02]} material={mat} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.2]} />
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
      {/* Sink */}
      <mesh position={[0.5, 0.93, 0]} material={metalMaterial} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.4]} />
      </mesh>
      {/* Faucet */}
      <mesh position={[0.5, 1.15, -0.15]} material={metalMaterial} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.4]} />
      </mesh>
    </group>
  );
}

function Painting({ position, rotation = 0, material = paintingMaterial1 }: { position: [number, number, number]; rotation?: number; material?: THREE.MeshStandardMaterial }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh material={frameMaterial} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.025]} material={material}>
        <boxGeometry args={[0.65, 0.45, 0.01]} />
      </mesh>
    </group>
  );
}

function Rug({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} material={rugMaterial} receiveShadow>
      <planeGeometry args={[2.5, 1.8]} />
    </mesh>
  );
}

function PlantPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={plantPotMaterial} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={plantMaterial} castShadow>
        <sphereGeometry args={[0.25, 8, 6]} />
      </mesh>
    </group>
  );
}

function Nightstand({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.3, 0]} material={darkWoodMaterial} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.4]} />
      </mesh>
      {/* Lamp */}
      <mesh position={[0, 0.7, 0]} material={darkWoodMaterial} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.2, 8]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#fff8e7" emissive="#fff8e7" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Toilet({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} material={porcelainMaterial} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.55]} />
      </mesh>
      <mesh position={[0, 0.5, -0.15]} material={porcelainMaterial} castShadow>
        <boxGeometry args={[0.38, 0.35, 0.1]} />
      </mesh>
    </group>
  );
}

function BathroomSink({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} material={porcelainMaterial} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.45]} />
      </mesh>
      <mesh position={[0, 0.55, -0.15]} material={metalMaterial} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.25]} />
      </mesh>
    </group>
  );
}

function Window({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh material={frameMaterial} castShadow>
        <boxGeometry args={[1, 0.8, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.01]} material={glassMaterial}>
        <boxGeometry args={[0.85, 0.65, 0.02]} />
      </mesh>
    </group>
  );
}

export default function House() {
  const WALL_HEIGHT = 2.8;
  const WALL_THICK = 0.15;
  const HOUSE_W = 12;
  const HOUSE_D = 10;
  
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[HOUSE_W, HOUSE_D]} />
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]} material={ceilingMaterial} receiveShadow>
        <planeGeometry args={[HOUSE_W, HOUSE_D]} />
      </mesh>

      {/* === OUTER WALLS === */}
      {/* Front wall (z = 5) - with gap for front door */}
      <Wall position={[-4, WALL_HEIGHT / 2, 5]} size={[4, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[4, WALL_HEIGHT / 2, 5]} size={[4, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[0, WALL_HEIGHT - 0.3, 5]} size={[4, 0.6, WALL_THICK]} /> {/* Above door */}

      {/* Back wall (z = -5) */}
      <Wall position={[0, WALL_HEIGHT / 2, -5]} size={[HOUSE_W, WALL_HEIGHT, WALL_THICK]} />
      
      {/* Left wall (x = -6) */}
      <Wall position={[-6, WALL_HEIGHT / 2, 0]} size={[WALL_THICK, WALL_HEIGHT, HOUSE_D]} />
      
      {/* Right wall (x = 6) */}
      <Wall position={[6, WALL_HEIGHT / 2, 0]} size={[WALL_THICK, WALL_HEIGHT, HOUSE_D]} />

      {/* === INTERIOR WALLS === */}
      {/* Wall dividing living room from kitchen (horizontal, z=1) */}
      <Wall position={[-1.5, WALL_HEIGHT / 2, 1]} size={[3, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[4.5, WALL_HEIGHT / 2, 1]} size={[3, WALL_HEIGHT, WALL_THICK]} />

      {/* Wall dividing living room from hallway (vertical, x=0) - partial */}
      <Wall position={[0, WALL_HEIGHT / 2, -2]} size={[WALL_THICK, WALL_HEIGHT, 6]} />
      
      {/* Bedroom wall (z=-2, right side) - with doorway */}
      <Wall position={[4.5, WALL_HEIGHT / 2, -2]} size={[3, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[1.2, WALL_HEIGHT / 2, -2]} size={[2.2, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[2.7, WALL_HEIGHT - 0.3, -2]} size={[1, 0.6, WALL_THICK]} />

      {/* Bathroom wall */}
      <Wall position={[-3, WALL_HEIGHT / 2, -2]} size={[6, WALL_HEIGHT, WALL_THICK]} />
      <Wall position={[-3, WALL_HEIGHT / 2, -2]} size={[WALL_THICK, WALL_HEIGHT, 6]} />
      {/* Bathroom door gap wall segments */}
      <Wall position={[-3, WALL_HEIGHT / 2, 0.5]} size={[WALL_THICK, WALL_HEIGHT, 1]} />

      {/* === LIVING ROOM (front-left, x:-6 to 0, z:1 to 5) === */}
      <Sofa position={[-3, 0, 3.5]} rotation={Math.PI} />
      <Table position={[-3, 0, 2]} />
      <Rug position={[-3, 0.01, 2.8]} />
      <Bookshelf position={[-5.7, 0, 3]} rotation={Math.PI / 2} />
      <PlantPot position={[-5.5, 0, 1.5]} />
      <Painting position={[-3, 1.8, 4.9]} />
      <Window position={[-6, 1.5, 3]} rotation={Math.PI / 2} />

      {/* === KITCHEN (front-right, x:0 to 6, z:1 to 5) === */}
      <KitchenCounter position={[4.5, 0, 4.5]} />
      <DiningTable position={[3, 0, 2.5]} />
      <Chair position={[2.2, 0, 2.5]} rotation={Math.PI / 2} />
      <Chair position={[3.8, 0, 2.5]} rotation={-Math.PI / 2} />
      <Chair position={[3, 0, 1.8]} rotation={Math.PI} />
      <Chair position={[3, 0, 3.2]} />
      <Window position={[6, 1.5, 3]} rotation={-Math.PI / 2} />
      <Painting position={[1.5, 1.8, 1.05]} material={paintingMaterial2} />

      {/* === BEDROOM (back-right, x:0 to 6, z:-5 to -2) === */}
      <Bed position={[4, 0, -3.8]} />
      <Nightstand position={[5.5, 0, -3.8]} />
      <Nightstand position={[2.5, 0, -3.8]} />
      <Rug position={[4, 0.01, -3]} rotation={Math.PI / 4} />
      <PlantPot position={[0.5, 0, -4.5]} />
      <Window position={[6, 1.5, -3.5]} rotation={-Math.PI / 2} />
      <Painting position={[3, 1.8, -4.9]} material={paintingMaterial2} />

      {/* === BATHROOM (back-left, x:-6 to -3, z:-5 to -2) === */}
      {/* Bathroom floor tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.5, 0.01, -3.5]} material={tileMaterial} receiveShadow>
        <planeGeometry args={[3, 3]} />
      </mesh>
      <Toilet position={[-5.3, 0, -4.3]} rotation={Math.PI / 2} />
      <BathroomSink position={[-4, 0, -4.8]} />
      {/* Bathtub */}
      <mesh position={[-4.5, 0.3, -2.5]} material={porcelainMaterial} castShadow>
        <boxGeometry args={[1.6, 0.6, 0.7]} />
      </mesh>
      <Window position={[-6, 1.5, -3.5]} rotation={Math.PI / 2} />

      {/* === HALLWAY (back-center, x:-3 to 0, z:-5 to -2) === */}
      <PlantPot position={[-1.5, 0, -4.5]} />
      <Painting position={[-0.1, 1.6, -3.5]} rotation={Math.PI / 2} material={paintingMaterial1} />

      {/* === LIGHTING === */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 3]} intensity={0.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      
      {/* Room lights */}
      <pointLight position={[-3, 2.5, 3]} intensity={0.8} color="#fff5e0" distance={8} />
      <pointLight position={[3, 2.5, 3]} intensity={0.6} color="#fff8f0" distance={8} />
      <pointLight position={[4, 2.5, -3.5]} intensity={0.4} color="#ffe8c0" distance={6} />
      <pointLight position={[-4.5, 2.5, -3.5]} intensity={0.5} color="#ffffff" distance={5} />
      <pointLight position={[-1.5, 2.5, -3.5]} intensity={0.3} color="#fff5e0" distance={5} />
      
      {/* Outside light through door */}
      <pointLight position={[0, 2, 6]} intensity={1} color="#87ceeb" distance={8} />
    </group>
  );
}
