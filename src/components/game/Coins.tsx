import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

function CoinItem({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 3;
      ref.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 2.5) * 0.12;
    }
  });
  return (
    <group position={[position[0], 0, position[2]]}>
      <group ref={ref}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={1.5} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.12, 16]} />
          <meshStandardMaterial color="#cc8800" emissive="#cc8800" emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <pointLight color="#ffd700" intensity={1.2} distance={4} />
    </group>
  );
}

export default function Coins() {
  const { coinPickups } = useGame();
  return (
    <>
      {coinPickups.map((c) => (
        <CoinItem key={c.id} position={c.position} />
      ))}
    </>
  );
}
