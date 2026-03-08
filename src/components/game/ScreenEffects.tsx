import { useState, useEffect, useRef } from "react";
import { useGame } from "./GameState";
import { MAP_WEATHER } from "./WeatherSystem";

export default function ScreenEffects() {
  const { playerHealth, maxHealth, isPlaying, gameOver, selectedMap } = useGame();
  const [shaking, setShaking] = useState(false);
  const prevHealth = useRef(playerHealth);

  // Detect damage for screen shake
  useEffect(() => {
    if (playerHealth < prevHealth.current && isPlaying) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      prevHealth.current = playerHealth;
      return () => clearTimeout(t);
    }
    prevHealth.current = playerHealth;
  }, [playerHealth, isPlaying]);

  if (!isPlaying || gameOver) return null;

  const map = selectedMap || "suburban";
  const weather = MAP_WEATHER[map];
  const lowHP = playerHealth <= 1;
  const hpRatio = playerHealth / maxHealth;
  const hasFog = weather === "fog" || weather === "storm";

  return (
    <>
      {/* Fog + low HP vignette combined */}
      {(hasFog || lowHP) && (
        <div
          className="fixed inset-0 z-30 pointer-events-none"
          style={{
            background: lowHP
              ? `radial-gradient(ellipse at center, transparent 40%, rgba(200,0,0,${0.4 - hpRatio * 0.3}) 100%)`
              : weather === "fog"
              ? "radial-gradient(ellipse at center, rgba(80,80,90,0.3) 0%, rgba(60,60,70,0.6) 70%, rgba(40,40,50,0.8) 100%)"
              : "radial-gradient(ellipse at center, rgba(40,40,55,0.15) 0%, rgba(30,30,45,0.35) 80%)",
          }}
        />
      )}

      {/* Damage flash */}
      {shaking && (
        <div
          className="fixed inset-0 z-[55] pointer-events-none"
          style={{
            backgroundColor: "rgba(255,0,0,0.15)",
            animation: "fade-out 0.3s ease-out forwards",
          }}
        />
      )}
    </>
  );
}
