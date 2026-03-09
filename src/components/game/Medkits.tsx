import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

function MedkitItem({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 2;
      ref.current.position.y = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.15;
    }
  });
  return (
    <group position={[position[0], 0, position[2]]}>
      <group ref={ref}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#22cc44" emissive="#22cc44" emissiveIntensity={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.21]}>
          <boxGeometry args={[0.22, 0.06, 0.01]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.21]}>
          <boxGeometry args={[0.06, 0.22, 0.01]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <pointLight color="#22cc44" intensity={2} distance={5} />
    </group>
  );
}

function AmmoPickupItem({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = -clock.elapsedTime * 2.5;
      ref.current.position.y = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.12;
    }
  });
  return (
    <group position={[position[0], 0, position[2]]}>
      <group ref={ref}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={1.2} roughness={0.2} metalness={0.5} />
        </mesh>
        {/* Ammo symbol */}
        <mesh position={[0, 0, 0.21]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#fff" emissive="#ffcc00" emissiveIntensity={2} />
        </mesh>
      </group>
      <pointLight color="#ffaa00" intensity={1.5} distance={4} />
    </group>
  );
}

export default function Medkits() {
  const { medkits, ammoPickups, role } = useGame();
  return (
    <>
      {medkits.map((m) => (
        <MedkitItem key={m.id} position={m.position} />
      ))}
      {role === "runner" && ammoPickups.map((a) => (
        <AmmoPickupItem key={a.id} position={a.position} />
      ))}
    </>
  );
}
