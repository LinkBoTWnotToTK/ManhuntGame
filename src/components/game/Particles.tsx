import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./GameState";

// Floating dust particles for atmosphere
export function DustParticles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = Math.random() * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40 - 4;
    }
    return arr;
  }, [count]);

  const speeds = useMemo(() => {
    return Array.from({ length: count }, () => 0.02 + Math.random() * 0.05);
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += speeds[i] * 0.3;
      pos.array[i * 3] += Math.sin(t * 0.3 + i) * 0.002;
      // Reset when too high
      if (pos.array[i * 3 + 1] > 5) {
        pos.array[i * 3 + 1] = 0;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#aabbcc"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Firefly-like particles near the escape portal
export function PortalParticles() {
  const { escapeOpen } = useGame();
  const ref = useRef<THREE.Points>(null);
  const count = 60;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 3;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 4;
      arr[i * 3 + 2] = -18 + Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const angle = t * 0.5 + i * 0.1;
      const r = 1.5 + Math.sin(t * 0.3 + i) * 1;
      pos.array[i * 3] = Math.cos(angle) * r;
      pos.array[i * 3 + 1] = 1.5 + Math.sin(t * 2 + i * 0.5) * 1.5;
      pos.array[i * 3 + 2] = -18 + Math.sin(angle) * r;
    }
    pos.needsUpdate = true;
    // Pulse size
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.size = escapeOpen ? 0.08 + Math.sin(t * 4) * 0.03 : 0.04;
    mat.opacity = escapeOpen ? 0.8 : 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={escapeOpen ? "#00ff88" : "#ff4444"}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
