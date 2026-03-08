import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projectiles } from "./SharedState";

const SPEED = 22;
const MAX_AGE = 2.5;

export default function ProjectileSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const meshPool = useRef<THREE.Mesh[]>([]);
  const geo = useRef<THREE.SphereGeometry | null>(null);
  const mat = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((_, delta) => {
    for (const p of projectiles) {
      if (!p.alive) continue;
      p.position.addScaledVector(p.direction, SPEED * delta);
      p.age += delta;
      if (p.age > MAX_AGE || Math.abs(p.position.x) > 25 || Math.abs(p.position.z) > 40) {
        p.alive = false;
      }
    }
    // Remove dead projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (!projectiles[i].alive) projectiles.splice(i, 1);
    }

    const group = groupRef.current;
    if (!group) return;
    if (!geo.current) geo.current = new THREE.SphereGeometry(0.1, 4, 4);
    if (!mat.current) mat.current = new THREE.MeshStandardMaterial({ color: "#ffcc00", emissive: "#ffaa00", emissiveIntensity: 3 });

    // Grow pool if needed
    while (meshPool.current.length < projectiles.length) {
      const mesh = new THREE.Mesh(geo.current, mat.current);
      group.add(mesh);
      meshPool.current.push(mesh);
    }

    // Remove excess pool meshes to free memory
    while (meshPool.current.length > projectiles.length + 5) {
      const mesh = meshPool.current.pop()!;
      group.remove(mesh);
      mesh.geometry = undefined as any; // release ref
    }

    for (let i = 0; i < meshPool.current.length; i++) {
      if (i < projectiles.length) {
        meshPool.current[i].visible = true;
        meshPool.current[i].position.copy(projectiles[i].position);
      } else {
        meshPool.current[i].visible = false;
      }
    }
  });

  return <group ref={groupRef} />;
}
