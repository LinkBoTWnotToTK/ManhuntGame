import { useState, useEffect, useRef } from "react";
import { useGame } from "./GameState";
import { MAP_WEATHER } from "./WeatherSystem";

export default function ScreenEffects() {
  const { playerHealth, maxHealth, isPlaying, gameOver, selectedMap } = useGame();
  const [shaking, setShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const prevHealth = useRef(playerHealth);
  const [isSprinting, setIsSprinting] = useState(false);

  // Detect damage for screen shake
  useEffect(() => {
    if (playerHealth < prevHealth.current && isPlaying) {
      const dmg = prevHealth.current - playerHealth;
      setShakeIntensity(Math.min(dmg * 4, 12));
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      prevHealth.current = playerHealth;
      return () => clearTimeout(t);
    }
    prevHealth.current = playerHealth;
  }, [playerHealth, isPlaying]);

  // Sprint detection via keyboard
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") setIsSprinting(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") setIsSprinting(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  if (!isPlaying || gameOver) return null;

  const lowHP = playerHealth <= 1;
  const hpRatio = playerHealth / maxHealth;

  return (
    <>
      {/* Red vignette when low health */}
      {lowHP && (
        <div
          className="fixed inset-0 z-40 pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(200,0,0,${0.4 - hpRatio * 0.3}) 100%)`,
          }}
        />
      )}

      {/* Screen shake */}
      {shaking && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            animation: `shake ${0.05}s ease-in-out infinite`,
            transform: `translate(${(Math.random() - 0.5) * shakeIntensity}px, ${(Math.random() - 0.5) * shakeIntensity}px)`,
          }}
        />
      )}

      {/* Motion blur when sprinting */}
      {isSprinting && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)",
            filter: "blur(0.5px)",
          }}
        />
      )}

      {/* Damage flash */}
      {shaking && (
        <div
          className="fixed inset-0 z-[55] pointer-events-none"
          style={{
            backgroundColor: `rgba(255,0,0,${0.15 + shakeIntensity * 0.02})`,
            animation: "fade-out 0.3s ease-out forwards",
          }}
        />
      )}
    </>
  );
}
