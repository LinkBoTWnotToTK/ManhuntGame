import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, GameMap } from "./GameState";

// Weather types per map
const MAP_WEATHER: Record<GameMap, "clear" | "rain" | "snow" | "fog" | "ash"> = {
  suburban: "clear",
  industrial: "fog",
  forest: "rain",
  arctic: "snow",
  underground: "clear",
  volcano: "ash",
  space_station: "clear",
};

function RainDrops() {
  const ref = useRef<THREE.Points>(null);
  const count = 800;

  const positions = useRef(new Float32Array(count * 3));
  const velocities = useRef(new Float32Array(count));

  // Initialize
  useRef(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 60;
      positions.current[i * 3 + 1] = Math.random() * 30;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
      velocities.current[i] = 15 + Math.random() * 10;
    }
  }).current;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute("position");
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities.current[i] * delta;
      if (arr[i * 3 + 1] < -1) {
        arr[i * 3] = (Math.random() - 0.5) * 60;
        arr[i * 3 + 1] = 25 + Math.random() * 5;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    posAttr.needsUpdate = true;
  });

  // Init positions
  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 60;
    positions.current[i * 3 + 1] = Math.random() * 30;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
    velocities.current[i] = 15 + Math.random() * 10;
  }

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial color="#8899bb" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function SnowFlakes() {
  const ref = useRef<THREE.Points>(null);
  const count = 500;
  const positions = useRef(new Float32Array(count * 3));
  const drifts = useRef(new Float32Array(count * 2));

  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 60;
    positions.current[i * 3 + 1] = Math.random() * 25;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
    drifts.current[i * 2] = (Math.random() - 0.5) * 2;
    drifts.current[i * 2 + 1] = 2 + Math.random() * 3;
  }

  useFrame((state, delta) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute("position");
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t + i) * drifts.current[i * 2] * delta;
      arr[i * 3 + 1] -= drifts.current[i * 2 + 1] * delta;
      if (arr[i * 3 + 1] < -1) {
        arr[i * 3] = (Math.random() - 0.5) * 60;
        arr[i * 3 + 1] = 22 + Math.random() * 3;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 60;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.12} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function AshParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;
  const positions = useRef(new Float32Array(count * 3));

  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 60;
    positions.current[i * 3 + 1] = Math.random() * 20;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }

  useFrame((state, delta) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute("position");
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * 0.5 + i) * 0.5 * delta;
      arr[i * 3 + 1] += (Math.sin(t + i * 0.3) * 0.3 - 0.5) * delta;
      if (arr[i * 3 + 1] < -1 || arr[i * 3 + 1] > 20) {
        arr[i * 3 + 1] = 15 + Math.random() * 5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial color="#ff6644" size={0.08} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Day/night cycle affects lighting
function DayNightCycle() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Slow cycle: ~120s full cycle
    const cycle = (Math.sin(t * 0.05) + 1) / 2; // 0 = night, 1 = day
    
    if (lightRef.current) {
      lightRef.current.intensity = 0.3 + cycle * 1.2;
      const r = 0.9 + cycle * 0.1;
      const g = 0.7 + cycle * 0.3;
      const b = 0.5 + cycle * 0.5;
      lightRef.current.color.setRGB(r, g, b);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.1 + cycle * 0.4;
    }
  });

  return (
    <>
      <directionalLight ref={lightRef} position={[20, 25, -10]} intensity={1} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-60} />
      <ambientLight ref={ambientRef} intensity={0.3} />
    </>
  );
}

export default function WeatherSystem() {
  const { selectedMap, isPlaying } = useGame();
  if (!isPlaying) return null;

  const map = selectedMap || "suburban";
  const weather = MAP_WEATHER[map];

  return (
    <>
      <DayNightCycle />
      {weather === "rain" && <RainDrops />}
      {weather === "snow" && <SnowFlakes />}
      {weather === "ash" && <AshParticles />}
    </>
  );
}
