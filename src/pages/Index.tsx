import { Canvas } from "@react-three/fiber";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { getSpawnPositions } from "@/components/game/NPC";
import { GameProvider, useGame } from "@/components/game/GameState";
import AudioSystem from "@/components/game/AudioSystem";
import { DustParticles, PortalParticles } from "@/components/game/Particles";
import ProjectileSystem from "@/components/game/ProjectileSystem";
import Medkits from "@/components/game/Medkits";

function GameScene() {
  const { role, selectedMap } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);

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
      <Medkits />
      <AudioSystem />
    </>
  );
}

const Index = () => (
  <GameProvider>
    <div className="w-screen h-screen bg-black overflow-hidden">
      <GameUI />
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 120 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.4 }}
        dpr={[1, 1.5]}
      >
        <GameScene />
      </Canvas>
    </div>
  </GameProvider>
);

export default Index;
