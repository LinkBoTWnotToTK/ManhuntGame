import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

interface HiderProps {
  id: string;
  position: [number, number, number];
  color?: string;
}

function HiderFigure({ color = "#ff6b6b" }: { color: string }) {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.15, 0]}>
        <capsuleGeometry args={[0.07, 0.15, 6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.04, 0.37, 0.08]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.04, 0.37, 0.08]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export default function Collectible({ id, position, color = "#ff6b6b" }: HiderProps) {
  const ref = useRef<THREE.Group>(null);
  const { collected, collect, isPlaying } = useGame();
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  const isCollected = collected.has(id);

  useFrame((state, delta) => {
    if (isCollected && !animating) return;
    if (!ref.current) return;

    if (animating) {
      animProgress.current += delta * 4;
      const s = Math.max(0, 1 - animProgress.current);
      ref.current.scale.setScalar(s);
      ref.current.position.y = position[1] + animProgress.current * 0.5;
      if (animProgress.current >= 1) {
        ref.current.visible = false;
      }
      return;
    }

    // Subtle idle sway like nervous hiding
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 1.5 + position[0] * 2) * 0.15;
    ref.current.position.y = position[1] + Math.sin(t * 3 + position[2]) * 0.01;

    // Look toward camera when close
    if (isPlaying) {
      const camPos = state.camera.position;
      const dist = camPos.distanceTo(new THREE.Vector3(position[0], camPos.y, position[2]));
      if (dist < 1.5) {
        const dir = new THREE.Vector3().subVectors(camPos, ref.current.position);
        dir.y = 0;
        const targetRot = Math.atan2(dir.x, dir.z);
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot, 0.1);
      }
      // Tag when very close
      if (dist < 1.0) {
        collect(id);
        setAnimating(true);
        animProgress.current = 0;
      }
    }
  });

  if (isCollected && !animating) return null;

  return (
    <group ref={ref} position={position}>
      <HiderFigure color={color} />
    </group>
  );
}

// Hiders tucked into hiding spots around the house
export const COLLECTIBLE_DATA: { id: string; position: [number, number, number]; color: string }[] = [
  { id: "hider_1", position: [-5.8, 0, 1.5], color: "#ff6b6b" },       // Living room corner
  { id: "hider_2", position: [-3, 0, 3.8], color: "#feca57" },          // Behind sofa
  { id: "hider_3", position: [3.2, 0, 2.2], color: "#4ecdc4" },         // Kitchen table
  { id: "hider_4", position: [5.8, 0, 4.8], color: "#a8e6cf" },         // Kitchen corner
  { id: "hider_5", position: [5.8, 0, -4.2], color: "#c792ea" },        // Bedroom corner
  { id: "hider_6", position: [0.5, 0, -4.8], color: "#ff9ff3" },        // Bedroom by plant
  { id: "hider_7", position: [-5.5, 0, -4.5], color: "#48dbfb" },       // Bathroom
  { id: "hider_8", position: [-1.5, 0, -4.8], color: "#f368e0" },       // Hallway
];
