import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

function CoinItem({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 3;
      ref.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 2.5) * 0.12;
    }
  });
  return (
    <mesh ref={ref} position={[position[0], 0.5, position[2]]} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
      <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={1.5} metalness={0.8} roughness={0.15} />
    </mesh>
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
