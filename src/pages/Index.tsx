import { Canvas } from "@react-three/fiber";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { RUNNER_NPCS, HUNTER_NPCS } from "@/components/game/NPC";
import { GameProvider, useGame } from "@/components/game/GameState";

function GameScene() {
  const { role } = useGame();

  return (
    <>
      <House />
      {role === "hunter" &&
        RUNNER_NPCS.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
      {role === "runner" &&
        HUNTER_NPCS.map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)}
      <Player />
    </>
  );
}

const Index = () => (
  <GameProvider>
    <div className="w-screen h-screen bg-black overflow-hidden">
      <GameUI />
      <Canvas shadows camera={{ fov: 80, near: 0.1, far: 100 }} gl={{ antialias: true }}>
        <GameScene />
      </Canvas>
    </div>
  </GameProvider>
);

export default Index;
