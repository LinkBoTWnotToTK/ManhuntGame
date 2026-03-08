import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { getSpawnPositions } from "@/components/game/NPC";
import { GameProvider, useGame, DIFFICULTY_SETTINGS } from "@/components/game/GameState";
import AudioSystem from "@/components/game/AudioSystem";
import { DustParticles, PortalParticles } from "@/components/game/Particles";
import ProjectileSystem from "@/components/game/ProjectileSystem";
import Medkits from "@/components/game/Medkits";
import Coins from "@/components/game/Coins";
import GrabbableObjects from "@/components/game/GrabbableObjects";
import Minimap from "@/components/game/Minimap";
import ScreenEffects from "@/components/game/ScreenEffects";
import WeaponSystem from "@/components/game/WeaponSystem";

function KothZone() {
  const { kothZone, isPlaying } = useGame();
  if (!kothZone || !isPlaying) return null;
  return (
    <group position={kothZone}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 4, 32]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function Checkpoints() {
  const { checkpoints, checkpointIndex, isPlaying, gameMode } = useGame();
  if (!isPlaying || checkpoints.length === 0) return null;
  const isParkour = gameMode === "parkour" || gameMode === "deathrun";
  return (
    <>
      {checkpoints.map((cp, i) => {
        if (i < checkpointIndex) return null;
        const isCurrent = i === checkpointIndex;
        const color = isParkour
          ? (isCurrent ? "#ff44ff" : "#884488")
          : (isCurrent ? "#00ffcc" : "#ffffff");
        return (
          <group key={i} position={cp}>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={isCurrent ? color : "#444444"}
                emissiveIntensity={isCurrent ? 1.5 : 0.2}
                transparent opacity={isCurrent ? 0.6 : 0.2}
              />
            </mesh>
            {isCurrent && (
              <pointLight color={color} intensity={3} distance={8} position={[0, 2, 0]} />
            )}
            {/* Ring marker for parkour */}
            {isParkour && isCurrent && (
              <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.1, 8, 24]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

function FlagObject() {
  const { flagPosition, flagCarried, basePosition, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "ctf") return null;

  return (
    <>
      {/* Flag */}
      {flagPosition && !flagCarried && (
        <group position={flagPosition}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
            <meshStandardMaterial color="#888" metalness={0.8} />
          </mesh>
          <mesh position={[0.4, 2.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.5, 0.05]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
          </mesh>
          <pointLight position={[0, 3, 0]} color="#ff0000" intensity={3} distance={10} />
        </group>
      )}
      {/* Base beacon */}
      {basePosition && (
        <group position={basePosition}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2, 3, 32]} />
            <meshStandardMaterial
              color={flagCarried ? "#00ff44" : "#4444ff"}
              emissive={flagCarried ? "#00ff44" : "#4444ff"}
              emissiveIntensity={flagCarried ? 2 : 0.5}
              transparent opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          {flagCarried && (
            <pointLight position={[0, 2, 0]} color="#00ff44" intensity={5} distance={12} />
          )}
        </group>
      )}
    </>
  );
}

function SurvivalWaveIndicator() {
  const { survivalWave, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "survival") return null;
  return null; // Wave info is shown in HUD
}

function GameScene() {
  const { role, selectedMap, ownedPowerups, difficulty, gameMode, survivalWave } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);
  const fov = ownedPowerups.includes("eagle_eye") ? 65 : 55;
  const diff = DIFFICULTY_SETTINGS[difficulty];

  // In survival mode, more hunters spawn with each wave
  const survivalHunterCount = gameMode === "survival" ? Math.min(7, 2 + survivalWave) : diff.hunterCount;

  // Parkour/deathrun: fewer NPCs, focus on platforming
  const isPlatformMode = gameMode === "parkour" || gameMode === "deathrun";
  const isBlockHunt = gameMode === "blockhunt";

  return (
    <>
      <House />
      <DustParticles count={300} />
      <PortalParticles />
      {role === "hunter" && !isPlatformMode && (
        <>
          {spawns.runners.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
          {spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      {role === "runner" && !isPlatformMode && (
        <>
          {gameMode === "survival"
            ? spawns.hunters.slice(0, survivalHunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
            : spawns.hunters.slice(0, diff.hunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
          }
        </>
      )}
      {/* Block Hunt: seekers (hunters) roam looking for disguised players */}
      {isBlockHunt && role === "runner" && (
        spawns.hunters.slice(0, 3).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
      )}
      {/* Parkour: minimal chasers to keep pressure */}
      {isPlatformMode && role === "runner" && (
        spawns.hunters.slice(0, 1).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
      )}
      <Player />
      <ProjectileSystem />
      <WeaponSystem />
      <Medkits />
      <Coins />
      <GrabbableObjects />
      <AudioSystem />
      <KothZone />
      <Checkpoints />
      <FlagObject />
      <SurvivalWaveIndicator />
      <DynamicFOV fov={fov} />
    </>
  );
}

function DynamicFOV({ fov }: { fov: number }) {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = fov;
  cam.updateProjectionMatrix();
  return null;
}

const Index = () => (
  <GameProvider>
    <div className="w-screen h-screen bg-black overflow-hidden">
      <GameUI />
      <Minimap />
      <ScreenEffects />
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.1, far: 150 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.4 }}
        dpr={[1, 1.5]}
      >
        <GameScene />
      </Canvas>
    </div>
  </GameProvider>
);

export default Index;
