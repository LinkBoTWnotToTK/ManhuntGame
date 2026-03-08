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
  const { checkpoints, checkpointIndex, isPlaying } = useGame();
  if (!isPlaying || checkpoints.length === 0) return null;
  return (
    <>
      {checkpoints.map((cp, i) => {
        if (i < checkpointIndex) return null;
        const isCurrent = i === checkpointIndex;
        return (
          <group key={i} position={cp}>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 3, 16]} />
              <meshStandardMaterial
                color={isCurrent ? "#00ffcc" : "#ffffff"}
                emissive={isCurrent ? "#00ffcc" : "#444444"}
                emissiveIntensity={isCurrent ? 1.5 : 0.2}
                transparent opacity={isCurrent ? 0.6 : 0.2}
              />
            </mesh>
            {isCurrent && (
              <pointLight color="#00ffcc" intensity={3} distance={8} position={[0, 2, 0]} />
            )}
          </group>
        );
      })}
    </>
  );
}

function GameScene() {
  const { role, selectedMap, ownedPowerups, difficulty, gameMode } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);
  const fov = ownedPowerups.includes("eagle_eye") ? 65 : 55;
  const diff = DIFFICULTY_SETTINGS[difficulty];

  return (
    <>
      <House />
      <DustParticles count={300} />
      <PortalParticles />
      {role === "hunter" && (
        <>
          {spawns.runners.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
          {spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      {role === "runner" &&
        spawns.hunters.slice(0, diff.hunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)}
      <Player />
      <ProjectileSystem />
      <WeaponSystem />
      <Medkits />
      <Coins />
      <GrabbableObjects />
      <AudioSystem />
      <KothZone />
      <Checkpoints />
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
