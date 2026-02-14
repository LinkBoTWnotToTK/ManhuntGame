import { Canvas } from "@react-three/fiber";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import Collectible, { COLLECTIBLE_DATA } from "@/components/game/Collectible";
import { GameProvider } from "@/components/game/GameState";

const Index = () => {
  return (
    <GameProvider>
      <div className="w-screen h-screen bg-black overflow-hidden">
        <GameUI />
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 100 }}
          gl={{ antialias: true }}
        >
          <fog attach="fog" args={["#1a1a2e", 0, 20]} />
          <House />
          {COLLECTIBLE_DATA.map((item) => (
            <Collectible key={item.id} {...item} />
          ))}
          <Player />
        </Canvas>
      </div>
    </GameProvider>
  );
};

export default Index;
