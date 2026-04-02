import { useState, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import House from "@/components/game/House";
import Player from "@/components/game/Player";
import GameUI from "@/components/game/GameUI";
import NPC, { getSpawnPositions } from "@/components/game/NPC";
import { GameProvider, useGame, DIFFICULTY_SETTINGS, getUndergroundSupplies } from "@/components/game/GameState";
import AudioSystem from "@/components/game/AudioSystem";
import { DustParticles, PortalParticles } from "@/components/game/Particles";
import ProjectileSystem from "@/components/game/ProjectileSystem";
import Medkits from "@/components/game/Medkits";
import Coins from "@/components/game/Coins";
import GrabbableObjects from "@/components/game/GrabbableObjects";
import Minimap from "@/components/game/Minimap";
import ScreenEffects from "@/components/game/ScreenEffects";
import WeaponSystem from "@/components/game/WeaponSystem";
import Tutorial from "@/components/game/Tutorial";
import WeatherSystem from "@/components/game/WeatherSystem";
import LevelEditor from "@/components/game/LevelEditor";
import MobileControls from "@/components/game/MobileControls";
import { playerPosition } from "@/components/game/SharedState";

function FlagObject() {
  const { flagPosition, flagCarried, basePosition, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "ctf") return null;

  return (
    <>
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

// Dark underground tunnel system with supplies
function UndergroundArea() {
  const { isPlaying, selectedMap, isUnderground, healPlayer, collectAmmo } = useGame();
  if (!isPlaying || !selectedMap) return null;

  const supplies = getUndergroundSupplies(selectedMap);
  const baseY = -8;

  return (
    <group>
      {/* Underground chamber - dark with minimal lighting */}
      <mesh position={[0, baseY - 0.5, -22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, baseY + 4, -22]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#111111" roughness={1} />
      </mesh>

      {/* Tunnel walls */}
      {/* North wall */}
      <mesh position={[0, baseY + 2, -37]}>
        <boxGeometry args={[30, 4, 0.5]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, baseY + 2, -7]}>
        <boxGeometry args={[30, 4, 0.5]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      {/* East wall */}
      <mesh position={[15, baseY + 2, -22]}>
        <boxGeometry args={[0.5, 4, 30]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      {/* West wall */}
      <mesh position={[-15, baseY + 2, -22]}>
        <boxGeometry args={[0.5, 4, 30]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>

      {/* Internal tunnel walls creating corridors */}
      <mesh position={[-5, baseY + 2, -15]}>
        <boxGeometry args={[0.4, 4, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[5, baseY + 2, -28]}>
        <boxGeometry args={[0.4, 4, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, baseY + 2, -22]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Very dim lighting — dark and eerie */}
      <pointLight position={[0, baseY + 3, -15]} color="#442200" intensity={1.5} distance={8} decay={2} />
      <pointLight position={[-8, baseY + 3, -25]} color="#331100" intensity={1} distance={6} decay={2} />
      <pointLight position={[8, baseY + 3, -20]} color="#442200" intensity={1} distance={6} decay={2} />
      <pointLight position={[0, baseY + 3, -30]} color="#220000" intensity={0.8} distance={5} decay={2} />

      {/* Supply crates */}
      {supplies.map(supply => (
        <group key={supply.id} position={supply.position}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial
              color={supply.type === "medkit" ? "#224422" : supply.type === "ammo" ? "#333344" : "#443322"}
              roughness={0.8}
              emissive={supply.type === "medkit" ? "#003300" : supply.type === "ammo" ? "#000033" : "#332200"}
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Subtle glow */}
          <pointLight
            position={[0, 1, 0]}
            color={supply.type === "medkit" ? "#00ff44" : supply.type === "ammo" ? "#4444ff" : "#ffaa00"}
            intensity={0.5}
            distance={3}
          />
        </group>
      ))}

      {/* Ambient fog particles (simple mesh spheres) */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`fog${i}`} position={[
          -10 + Math.random() * 20,
          baseY + 1 + Math.random() * 2,
          -10 + Math.random() * -20
        ]}>
          <sphereGeometry args={[0.3, 4, 4]} />
          <meshBasicMaterial color="#332211" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function SurvivalWaveIndicator() {
  const { survivalWave, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "survival") return null;
  return null;
}

function GameScene() {
  const { role, selectedMap, ownedPowerups, difficulty, gameMode, survivalWave } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);
  const fov = ownedPowerups.includes("eagle_eye") ? 65 : 55;
  const diff = DIFFICULTY_SETTINGS[difficulty];

  const survivalHunterCount = gameMode === "survival" ? Math.min(7, 2 + survivalWave) : diff.hunterCount;
  const isTeamMode = gameMode === "ctf" || gameMode === "survival" || gameMode === "infection";

  return (
    <>
      <House />
      <DustParticles count={100} />
      <PortalParticles />
      {role === "hunter" && (
        <>
          {spawns.runners.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
          {spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      {role === "runner" && (
        <>
          {gameMode === "survival"
            ? spawns.hunters.slice(0, survivalHunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
            : spawns.hunters.slice(0, diff.hunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
          }
          {isTeamMode && spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      <Player />
      <ProjectileSystem />
      <WeaponSystem />
      <Medkits />
      <Coins />
      <GrabbableObjects />
      <AudioSystem />
      <FlagObject />
      <SurvivalWaveIndicator />
      <WeatherSystem />
      <UndergroundArea />
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

function HatchPrompt() {
  const { nearHatch, hatchPromptText, isPlaying } = useGame();
  if (!isPlaying || !nearHatch) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="bg-black/80 backdrop-blur-md rounded-xl px-5 py-2.5 border border-yellow-500/30 shadow-[0_0_20px_rgba(255,170,0,0.2)]">
        <span className="text-yellow-300 font-bold text-sm">🕳️ {hatchPromptText}</span>
      </div>
    </div>
  );
}

function GameContent() {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return <LevelEditor onExit={() => setShowEditor(false)} />;
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <GameUI onOpenEditor={() => setShowEditor(true)} />
      <Minimap />
      <ScreenEffects />
      <Tutorial />
      <HatchPrompt />
      <MobileControls />
      <Canvas
        shadows
        camera={{ fov: 55, near: 0.1, far: 120 }}
        gl={{ antialias: false, toneMapping: 3, toneMappingExposure: 1.4, powerPreference: "high-performance" }}
        dpr={[1, 1.2]}
      >
        <GameScene />
      </Canvas>
    </div>
  );
}

const Index = () => (
  <GameProvider>
    <GameContent />
  </GameProvider>
);

export default Index;
