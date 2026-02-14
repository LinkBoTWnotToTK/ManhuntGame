import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

interface CollectibleProps {
  id: string;
  position: [number, number, number];
  color?: string;
}

export default function Collectible({ id, position, color = "#ffd700" }: CollectibleProps) {
  const ref = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { collected, collect, isPlaying } = useGame();
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  const isCollected = collected.has(id);

  useFrame((state, delta) => {
    if (isCollected && !animating) return;
    if (!ref.current) return;

    if (animating) {
      animProgress.current += delta * 3;
      const s = Math.max(0, 1 - animProgress.current);
      ref.current.scale.setScalar(s);
      if (lightRef.current) lightRef.current.intensity = s * 2;
      if (animProgress.current >= 1) {
        ref.current.visible = false;
      }
      return;
    }

    // Float and rotate
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.1;
    ref.current.rotation.y += delta * 1.5;

    // Check distance to camera for collection
    if (isPlaying) {
      const camPos = state.camera.position;
      const dist = camPos.distanceTo(new THREE.Vector3(ref.current.position.x, camPos.y, ref.current.position.z));
      if (dist < 1.2) {
        collect(id);
        setAnimating(true);
        animProgress.current = 0;
      }
    }
  });

  if (isCollected && !animating) return null;

  return (
    <group ref={ref} position={position}>
      {/* Glowing orb */}
      <mesh>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Light */}
      <pointLight ref={lightRef} color={color} intensity={2} distance={4} />
    </group>
  );
}

// All collectible positions spread across the house
export const COLLECTIBLE_DATA: { id: string; position: [number, number, number]; color: string }[] = [
  { id: "orb_living1", position: [-5.5, 1.2, 1.5], color: "#ffd700" },      // Living room - by plant
  { id: "orb_living2", position: [-3, 0.8, 3.5], color: "#ff6b6b" },         // Living room - behind sofa
  { id: "orb_kitchen", position: [3, 1.1, 2.5], color: "#4ecdc4" },          // Kitchen - on dining table
  { id: "orb_kitchen2", position: [5.5, 1.2, 4.5], color: "#a8e6cf" },       // Kitchen - on counter
  { id: "orb_bedroom", position: [5.5, 0.8, -3.8], color: "#c792ea" },       // Bedroom - on nightstand
  { id: "orb_bedroom2", position: [0.5, 0.8, -4.5], color: "#ff9ff3" },      // Bedroom - by plant
  { id: "orb_bathroom", position: [-5.3, 0.8, -4.3], color: "#48dbfb" },     // Bathroom - by toilet
  { id: "orb_hallway", position: [-1.5, 0.8, -4.5], color: "#feca57" },      // Hallway - by plant
];
