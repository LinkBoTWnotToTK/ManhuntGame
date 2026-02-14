import { Canvas } from "@react-three/fiber";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";

const Index = () => {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <GameUI />
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={["#1a1a2e", 0, 20]} />
        <House />
        <Player />
      </Canvas>
    </div>
  );
};

export default Index;
