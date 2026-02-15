import { Canvas } from "@react-three/fiber";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { RUNNER_NPCS, HUNTER_NPCS } from "@/components/game/NPC";
import { GameProvider, useGame } from "@/components/game/GameState";
import AudioSystem from "@/components/game/AudioSystem";
import { DustParticles, PortalParticles } from "@/components/game/Particles";

function GameScene() {
  const { role } = useGame();

  return (
    <>
      <House />
      <DustParticles count={300} />
      <PortalParticles />
      {role === "hunter" &&
        RUNNER_NPCS.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
      {role === "runner" &&
        HUNTER_NPCS.map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)}
      <Player />
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
        camera={{ fov: 75, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
        dpr={[1, 1.5]}
      >
        <GameScene />
      </Canvas>
    </div>
  </GameProvider>
);

export default Index;
