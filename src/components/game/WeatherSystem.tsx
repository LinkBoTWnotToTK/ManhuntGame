import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, GameMap } from "./GameState";

// Weather types per map
export type WeatherType = "clear" | "rain" | "snow" | "fog" | "ash" | "storm";

export const MAP_WEATHER: Record<GameMap, WeatherType> = {
  suburban: "clear",
  industrial: "fog",
  forest: "storm",
  arctic: "snow",
  underground: "clear",
  volcano: "ash",
  space_station: "clear",
};

// Shared wind vector that Player.tsx reads
export const windForce = new THREE.Vector3(0, 0, 0);

function RainDrops({ heavy }: { heavy?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = heavy ? 1500 : 800;
  const positions = useRef(new Float32Array(count * 3));
  const velocities = useRef(new Float32Array(count));

  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 60;
    positions.current[i * 3 + 1] = Math.random() * 30;
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
    velocities.current[i] = heavy ? 20 + Math.random() * 15 : 15 + Math.random() * 10;
  }

  useFrame((_, delta) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute("position");
    if (!posAttr) return;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities.current[i] * delta;
      // Wind pushes rain sideways
      arr[i * 3] += windForce.x * delta * 2;
      arr[i * 3 + 2] += windForce.z * delta * 2;
      if (arr[i * 3 + 1] < -1) {
        arr[i * 3] = (Math.random() - 0.5) * 60;
        arr[i * 3 + 1] = 25 + Math.random() * 5;
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
      <pointsMaterial color={heavy ? "#667799" : "#8899bb"} size={heavy ? 0.06 : 0.05} transparent opacity={heavy ? 0.7 : 0.6} sizeAttenuation />
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

// Lightning flash — random bursts of bright light
function LightningSystem() {
  const lightRef = useRef<THREE.PointLight>(null);
  const [flash, setFlash] = useState(false);
  const nextFlash = useRef(2 + Math.random() * 5);
  const flashTimer = useRef(0);

  useFrame((_, delta) => {
    nextFlash.current -= delta;

    if (nextFlash.current <= 0 && !flash) {
      setFlash(true);
      flashTimer.current = 0.1 + Math.random() * 0.15; // flash duration
      nextFlash.current = 3 + Math.random() * 8; // next flash in 3-11s
    }

    if (flash) {
      flashTimer.current -= delta;
      if (lightRef.current) {
        lightRef.current.intensity = 50 + Math.random() * 80;
        lightRef.current.position.set(
          (Math.random() - 0.5) * 40,
          25 + Math.random() * 10,
          (Math.random() - 0.5) * 40
        );
      }
      if (flashTimer.current <= 0) {
        setFlash(false);
      }
    }
  });

  if (!flash) return null;

  return (
    <pointLight
      ref={lightRef}
      color="#ddeeff"
      intensity={80}
      distance={200}
      decay={1}
    />
  );
}

// Wind system — updates the shared windForce vector
function WindSystem() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Gusty wind that changes over time
    windForce.x = Math.sin(t * 0.3) * 2 + Math.sin(t * 1.1) * 1.5;
    windForce.z = Math.cos(t * 0.2) * 1.5 + Math.cos(t * 0.8) * 1;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      windForce.set(0, 0, 0);
    };
  }, []);

  return null;
}

// Fog effect — uses Three.js scene fog
function FogEffect({ density }: { density: number }) {
  useFrame(({ scene }) => {
    if (!scene.fog) {
      scene.fog = new THREE.FogExp2("#555566", density);
    }
    (scene.fog as THREE.FogExp2).density = density;
  });

  useEffect(() => {
    return () => {
      // Clear fog on unmount — will be set in useFrame with a ref
    };
  }, []);

  return null;
}

// Day/night cycle affects lighting
function DayNightCycle({ darkened }: { darkened?: boolean }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cycle = (Math.sin(t * 0.05) + 1) / 2;
    const dimFactor = darkened ? 0.5 : 1;

    if (lightRef.current) {
      lightRef.current.intensity = (0.3 + cycle * 1.2) * dimFactor;
      const r = 0.9 + cycle * 0.1;
      const g = 0.7 + cycle * 0.3;
      const b = 0.5 + cycle * 0.5;
      lightRef.current.color.setRGB(r, g, b);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = (0.1 + cycle * 0.4) * dimFactor;
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

  // Clear wind when not playing
  useEffect(() => {
    if (!isPlaying) windForce.set(0, 0, 0);
  }, [isPlaying]);

  if (!isPlaying) return null;

  const map = selectedMap || "suburban";
  const weather = MAP_WEATHER[map];

  return (
    <>
      <DayNightCycle darkened={weather === "storm" || weather === "fog"} />
      {weather === "rain" && <RainDrops />}
      {weather === "storm" && (
        <>
          <RainDrops heavy />
          <LightningSystem />
          <WindSystem />
          <FogEffect density={0.015} />
        </>
      )}
      {weather === "snow" && <SnowFlakes />}
      {weather === "ash" && <AshParticles />}
      {weather === "fog" && <FogEffect density={0.03} />}
    </>
  );
}
