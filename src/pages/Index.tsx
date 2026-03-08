import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { getSpawnPositions } from "@/components/game/NPC";
import { GameProvider, useGame } from "@/components/game/GameState";
import AudioSystem from "@/components/game/AudioSystem";
import { DustParticles, PortalParticles } from "@/components/game/Particles";
import ProjectileSystem from "@/components/game/ProjectileSystem";
import Medkits from "@/components/game/Medkits";
import Coins from "@/components/game/Coins";
import GrabbableObjects from "@/components/game/GrabbableObjects";
import Minimap from "@/components/game/Minimap";
import ScreenEffects from "@/components/game/ScreenEffects";
import WeaponSystem from "@/components/game/WeaponSystem";

function GameScene() {
  const { role, selectedMap, ownedPowerups } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);
  const fov = ownedPowerups.includes("eagle_eye") ? 65 : 55;

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
        spawns.hunters.map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)}
      <Player />
      <ProjectileSystem />
      <WeaponSystem />
      <Medkits />
      <Coins />
      <GrabbableObjects />
      <AudioSystem />
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
