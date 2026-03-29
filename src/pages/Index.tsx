import { useState, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
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
import Tutorial from "@/components/game/Tutorial";
import WeatherSystem from "@/components/game/WeatherSystem";
import LevelEditor from "@/components/game/LevelEditor";
import MobileControls from "@/components/game/MobileControls";
import { WARFARE_UNITS, WARFARE_STOCKPILES, type WarfareTower as WarfareTowerType, type WarfareUnit as WarfareUnitType } from "@/components/game/WarfareData";
import { playerPosition } from "@/components/game/SharedState";

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

function SurvivalWaveIndicator() {
  const { survivalWave, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "survival") return null;
  return null;
}

// === WARFARE 3D COMPONENTS ===

function WarfareTower3D({ tower }: { tower: WarfareTowerType }) {
  const ref = useRef<THREE.Group>(null);
  const healthPct = tower.health / tower.maxHealth;
  const isPlayer = tower.team === "player";
  const color = isPlayer ? "#4488ff" : "#ff4444";
  const isKing = tower.type === "king";
  const scale = isKing ? 1.5 : 1.0;

  return (
    <group ref={ref} position={tower.position}>
      {/* Tower base */}
      <mesh position={[0, scale * 2, 0]} castShadow>
        <cylinderGeometry args={[scale * 1.2, scale * 1.5, scale * 4, 8]} />
        <meshStandardMaterial color={isPlayer ? "#334488" : "#883333"} roughness={0.6} />
      </mesh>
      {/* Tower top */}
      <mesh position={[0, scale * 4.2, 0]} castShadow>
        <coneGeometry args={[scale * 1.6, scale * 1.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Crown for king tower */}
      {isKing && (
        <mesh position={[0, scale * 5.5, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 0.6, 6]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={1} />
        </mesh>
      )}
      {/* Health bar */}
      <group position={[0, scale * 5 + 1, 0]}>
        <mesh>
          <planeGeometry args={[2, 0.2]} />
          <meshBasicMaterial color="#222" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-(1 - healthPct), 0, 0.01]}>
          <planeGeometry args={[2 * healthPct, 0.2]} />
          <meshBasicMaterial color={healthPct > 0.5 ? "#33ff33" : healthPct > 0.25 ? "#ffaa00" : "#ff3333"} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Glow */}
      <pointLight position={[0, scale * 3, 0]} color={color} intensity={2} distance={10} />
    </group>
  );
}

function WarfareUnit3D({ unit }: { unit: { id: string; typeId: string; position: [number, number, number]; team: string; health: number; maxHealth: number } }) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...unit.position));
  const { warfareTowers, warfareUnits, damageWarfareTower, damageWarfareUnit } = useGame();
  const unitDef = WARFARE_UNITS.find(u => u.id === unit.typeId);
  const lastAttack = useRef(0);
  const healthBarRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current || !unitDef) return;
    const t = state.clock.elapsedTime;
    const myPos = posRef.current;

    // Find nearest target: enemy units first, then towers
    let targetPos: THREE.Vector3 | null = null;
    let targetId: string | null = null;
    let targetIsUnit = false;
    let nearestDist = Infinity;

    // Target enemy units
    for (const other of warfareUnits) {
      if (other.team === unit.team || !other.alive) continue;
      const otherPos = new THREE.Vector3(...other.position);
      const d = myPos.distanceTo(otherPos);
      if (d < nearestDist) {
        nearestDist = d;
        targetPos = otherPos;
        targetId = other.id;
        targetIsUnit = true;
      }
    }

    // If no enemy units nearby, target towers
    if (!targetPos || nearestDist > (unitDef.range + 5)) {
      for (const tower of warfareTowers) {
        if (tower.team === unit.team || tower.health <= 0) continue;
        const tPos = new THREE.Vector3(...tower.position);
        const d = myPos.distanceTo(tPos);
        if (d < nearestDist) {
          nearestDist = d;
          targetPos = tPos;
          targetId = tower.id;
          targetIsUnit = false;
        }
      }
    }

    // Move toward target
    if (targetPos) {
      const dir = new THREE.Vector3().subVectors(targetPos, myPos);
      dir.y = 0;
      const dist = dir.length();

      if (dist > unitDef.range) {
        dir.normalize();
        myPos.addScaledVector(dir, unitDef.speed * delta);
      } else {
        // Attack
        lastAttack.current += delta;
        if (lastAttack.current >= unitDef.attackCooldown && targetId) {
          lastAttack.current = 0;
          if (unitDef.id === "healer") {
            // Healer heals nearby allies instead
            // (simplified: no healing implemented yet)
          } else if (targetIsUnit) {
            damageWarfareUnit(targetId, unitDef.damage);
          } else {
            damageWarfareTower(targetId, unitDef.damage);
          }
        }
      }
    } else {
      // March forward (player units go -Z, enemy units go +Z)
      const marchDir = unit.team === "player" ? -1 : 1;
      myPos.z += marchDir * unitDef.speed * delta * 0.5;
    }

    ref.current.position.copy(myPos);
    // Bounce animation
    ref.current.position.y = Math.abs(Math.sin(t * 8)) * 0.05;
    
    // Face movement direction
    if (targetPos) {
      const lookDir = new THREE.Vector3().subVectors(targetPos, myPos);
      if (lookDir.lengthSq() > 0.01) {
        ref.current.rotation.y = Math.atan2(lookDir.x, lookDir.z);
      }
    }

    if (healthBarRef.current) healthBarRef.current.lookAt(state.camera.position);
  });

  if (!unitDef) return null;
  const isPlayer = unit.team === "player";
  const bodyColor = isPlayer ? unitDef.color : "#aa2222";
  const healthPct = unit.health / unit.maxHealth;

  return (
    <group ref={ref} position={unit.position}>
      {/* Body */}
      <mesh position={[0, unitDef.size * 0.7, 0]} castShadow>
        <capsuleGeometry args={[unitDef.size * 0.25, unitDef.size * 0.5, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, unitDef.size * 1.3, 0]}>
        <sphereGeometry args={[unitDef.size * 0.2, 6, 6]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Team indicator ring */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 12]} />
        <meshBasicMaterial color={isPlayer ? "#4488ff" : "#ff4444"} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Health bar */}
      <group ref={healthBarRef} position={[0, unitDef.size * 1.7, 0]}>
        <mesh>
          <planeGeometry args={[0.6, 0.06]} />
          <meshBasicMaterial color="#222" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-(1 - healthPct) * 0.3, 0, 0.001]}>
          <planeGeometry args={[0.6 * healthPct, 0.06]} />
          <meshBasicMaterial color={healthPct > 0.5 ? "#33ff33" : "#ff3333"} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function WarfareStockpiles() {
  const { isPlaying, gameMode, collectStockpile } = useGame();
  const collected = useRef<Set<number>>(new Set());

  useFrame(() => {
    if (!isPlaying || gameMode !== "warfare") return;
    WARFARE_STOCKPILES.forEach((sp, i) => {
      if (collected.current.has(i)) return;
      const dx = playerPosition.x - sp.position[0];
      const dz = playerPosition.z - sp.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        collected.current.add(i);
        collectStockpile(i);
      }
    });
  });

  if (!isPlaying || gameMode !== "warfare") return null;
  return (
    <>
      {WARFARE_STOCKPILES.map((sp, i) => (
        <group key={i} position={sp.position}>
          {!collected.current.has(i) && (
            <>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.5, 1, 1.5]} />
                <meshStandardMaterial
                  color={sp.resource === "elixir" ? "#8844cc" : "#ccaa22"}
                  emissive={sp.resource === "elixir" ? "#8844cc" : "#ccaa22"}
                  emissiveIntensity={0.5}
                />
              </mesh>
              <pointLight position={[0, 1.5, 0]} color={sp.resource === "elixir" ? "#8844cc" : "#ccaa22"} intensity={2} distance={6} />
            </>
          )}
        </group>
      ))}
    </>
  );
}

function WarfareClickHandler() {
  const { warfareSelectedUnit, placeWarfareUnit, isPlaying, gameMode } = useGame();
  const { raycaster, camera, pointer } = useThree();

  useFrame(() => {
    // Handled via click events on the ground plane
  });

  if (!isPlaying || gameMode !== "warfare" || !warfareSelectedUnit) return null;

  return (
    <mesh
      position={[0, 0.01, -10]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const point = e.point;
        // Only place on player's side (Z > -5)
        if (point.z > -5) {
          placeWarfareUnit(warfareSelectedUnit, [point.x, 0, point.z]);
        }
      }}
    >
      <planeGeometry args={[60, 80]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function WarfareBattlefield() {
  const { warfareTowers, warfareUnits, isPlaying, gameMode } = useGame();
  if (!isPlaying || gameMode !== "warfare") return null;

  return (
    <>
      {/* Towers */}
      {warfareTowers.map(tower => (
        <WarfareTower3D key={tower.id} tower={tower} />
      ))}
      {/* Units */}
      {warfareUnits.filter(u => u.alive).map(unit => (
        <WarfareUnit3D
          key={unit.id}
          unit={{ id: unit.id, typeId: unit.typeId, position: unit.position, team: unit.team, health: unit.health, maxHealth: unit.maxHealth }}
        />
      ))}
      {/* Battlefield dividing line */}
      <mesh position={[0, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 0.3]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Lane markers */}
      <mesh position={[-12, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 70]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[12, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, 70]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <WarfareStockpiles />
      <WarfareClickHandler />
    </>
  );
}

function GameScene() {
  const { role, selectedMap, ownedPowerups, difficulty, gameMode, survivalWave } = useGame();
  const map = selectedMap || "suburban";
  const spawns = getSpawnPositions(map);
  const fov = ownedPowerups.includes("eagle_eye") ? 65 : 55;
  const diff = DIFFICULTY_SETTINGS[difficulty];

  const survivalHunterCount = gameMode === "survival" ? Math.min(7, 2 + survivalWave) : diff.hunterCount;
  const isPlatformMode = gameMode === "parkour" || gameMode === "deathrun";
  const isBlockHunt = gameMode === "blockhunt";
  const isTeamMode = gameMode === "ctf" || gameMode === "survival" || gameMode === "infection";
  const isWarfare = gameMode === "warfare";

  return (
    <>
      <House />
      <DustParticles count={100} />
      <PortalParticles />
      {!isWarfare && role === "hunter" && !isPlatformMode && (
        <>
          {spawns.runners.map((npc) => <NPC key={npc.id} {...npc} npcRole="runner" />)}
          {spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      {!isWarfare && role === "runner" && !isPlatformMode && !isBlockHunt && (
        <>
          {gameMode === "survival"
            ? spawns.hunters.slice(0, survivalHunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
            : spawns.hunters.slice(0, diff.hunterCount).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)
          }
          {isTeamMode && spawns.allies.map((npc) => <NPC key={npc.id} {...npc} npcRole="ally" />)}
        </>
      )}
      {isBlockHunt && role === "runner" && (
        <>
          {spawns.hunters.slice(0, 3).map((npc) => <NPC key={npc.id} {...npc} npcRole="hunter" />)}
        </>
      )}
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
      <WeatherSystem />
      <WarfareBattlefield />
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
