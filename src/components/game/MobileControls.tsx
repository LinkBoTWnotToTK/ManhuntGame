import { useRef, useEffect, useCallback, useState } from "react";
import { mobileJoystick, mobileCameraDelta, mobileButtons } from "./SharedState";
import { useGame } from "./GameState";

const JOYSTICK_SIZE = 120;
const JOYSTICK_KNOB = 44;
const BUTTON_SIZE = 56;

export default function MobileControls() {
  const { role, isPlaying, gameOver, gameMode, isDisguised, toggleDisguise, switchWeapon, currentWeapon } = useGame();
  // Manual input mode toggle: "auto" | "mobile" | "desktop"
  const [inputMode, setInputMode] = useState<"auto" | "mobile" | "desktop">("auto");
  
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const cameraTouchId = useRef<number | null>(null);
  const cameraLastPos = useRef({ x: 0, y: 0 });

  // Determine effective mobile state
  const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
  const isMobile = inputMode === "auto" ? isTouchDevice : inputMode === "mobile";

  // Reset mobile state on unmount
  useEffect(() => {
    return () => {
      mobileJoystick.x = 0;
      mobileJoystick.y = 0;
      mobileCameraDelta.x = 0;
      mobileCameraDelta.y = 0;
      Object.keys(mobileButtons).forEach(k => (mobileButtons as any)[k] = false);
    };
  }, []);

  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickOrigin.current.x;
        const dy = touch.clientY - joystickOrigin.current.y;
        const maxDist = JOYSTICK_SIZE / 2 - JOYSTICK_KNOB / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        mobileJoystick.x = (Math.cos(angle) * clampedDist) / maxDist;
        mobileJoystick.y = (Math.sin(angle) * clampedDist) / maxDist;
      }
    }
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        mobileJoystick.x = 0;
        mobileJoystick.y = 0;
      }
    }
  }, []);

  // Camera touch (right side of screen) — improved sensitivity
  useEffect(() => {
    if (!isMobile || !isPlaying || gameOver) return;

    const handleTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.4 && cameraTouchId.current === null) {
          const target = touch.target as HTMLElement;
          if (target.closest('[data-mobile-btn]')) continue;
          cameraTouchId.current = touch.identifier;
          cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === cameraTouchId.current) {
          // Increased sensitivity from 0.005 to 0.008
          mobileCameraDelta.x = (touch.clientX - cameraLastPos.current.x) * 0.008;
          mobileCameraDelta.y = (touch.clientY - cameraLastPos.current.y) * 0.008;
          cameraLastPos.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === cameraTouchId.current) {
          cameraTouchId.current = null;
          mobileCameraDelta.x = 0;
          mobileCameraDelta.y = 0;
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isMobile, isPlaying, gameOver]);

  // Always show the toggle button during gameplay
  const toggleButton = isPlaying && !gameOver ? (
    <div className="fixed top-4 left-1/2 translate-x-16 z-[101]">
      <button
        onClick={() => setInputMode(prev => prev === "auto" ? "mobile" : prev === "mobile" ? "desktop" : "auto")}
        className="bg-black/60 backdrop-blur-sm text-white/60 hover:text-white/90 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-[10px] font-bold transition-all"
      >
        {inputMode === "auto" ? "🔄 Auto" : inputMode === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
      </button>
    </div>
  ) : null;

  if (!isMobile || !isPlaying || gameOver) return toggleButton;

  const btnClass = "rounded-full flex items-center justify-center select-none touch-none active:scale-90 transition-transform";

  return (
    <>
      {toggleButton}
      <div className="fixed inset-0 z-[100] pointer-events-none" style={{ touchAction: "none" }}>
        {/* Joystick - bottom left */}
        <div
          ref={joystickRef}
          className="absolute pointer-events-auto"
          style={{
            left: 24,
            bottom: 40,
            width: JOYSTICK_SIZE,
            height: JOYSTICK_SIZE,
            touchAction: "none",
          }}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
        >
          <div
            className="absolute rounded-full border-2 border-white/30 bg-black/30 backdrop-blur-sm"
            style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE }}
          />
          <div
            className="absolute rounded-full bg-white/60 border-2 border-white/80 shadow-lg"
            style={{
              width: JOYSTICK_KNOB,
              height: JOYSTICK_KNOB,
              left: JOYSTICK_SIZE / 2 - JOYSTICK_KNOB / 2 + mobileJoystick.x * (JOYSTICK_SIZE / 2 - JOYSTICK_KNOB / 2),
              top: JOYSTICK_SIZE / 2 - JOYSTICK_KNOB / 2 + mobileJoystick.y * (JOYSTICK_SIZE / 2 - JOYSTICK_KNOB / 2),
              transition: joystickTouchId.current !== null ? "none" : "all 0.15s ease-out",
            }}
          />
        </div>

        {/* Action buttons - bottom right */}
        <div className="absolute pointer-events-auto" style={{ right: 20, bottom: 40 }}>
          {/* Jump */}
          <button
            data-mobile-btn
            className={`${btnClass} bg-blue-500/60 border-2 border-blue-300/60 text-white absolute`}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, right: 0, bottom: 70 }}
            onTouchStart={(e) => { e.preventDefault(); mobileButtons.jump = true; }}
            onTouchEnd={() => { mobileButtons.jump = false; }}
            onTouchCancel={() => { mobileButtons.jump = false; }}
          >
            <span className="text-lg font-bold">⬆</span>
          </button>

          {/* Shoot */}
          <button
            data-mobile-btn
            className={`${btnClass} bg-red-500/60 border-2 border-red-300/60 text-white absolute`}
            style={{ width: BUTTON_SIZE + 8, height: BUTTON_SIZE + 8, right: 70, bottom: 30 }}
            onTouchStart={(e) => { e.preventDefault(); mobileButtons.shoot = true; }}
            onTouchEnd={() => { mobileButtons.shoot = false; }}
            onTouchCancel={() => { mobileButtons.shoot = false; }}
          >
            <span className="text-xl">{role === "hunter" ? "👊" : "🔫"}</span>
          </button>

          {/* Sprint */}
          <button
            data-mobile-btn
            className={`${btnClass} bg-yellow-500/60 border-2 border-yellow-300/60 text-white absolute`}
            style={{ width: BUTTON_SIZE - 8, height: BUTTON_SIZE - 8, right: 70, bottom: 100 }}
            onTouchStart={(e) => { e.preventDefault(); mobileButtons.sprint = true; }}
            onTouchEnd={() => { mobileButtons.sprint = false; }}
            onTouchCancel={() => { mobileButtons.sprint = false; }}
          >
            <span className="text-sm">🏃</span>
          </button>
        </div>

        {/* Weapon selector (runner only) */}
        {role === "runner" && (
          <div className="absolute pointer-events-auto flex gap-1" style={{ right: 16, top: 80 }}>
            {(["slingshot", "shotgun", "sniper"] as const).map((w, i) => (
              <button
                key={w}
                data-mobile-btn
                className={`${btnClass} text-xs px-2 py-1 ${currentWeapon === w ? "bg-white/40 border border-white/60" : "bg-black/40 border border-white/20"}`}
                onTouchStart={(e) => { e.preventDefault(); switchWeapon(w); }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Disguise button (block hunt) */}
        {gameMode === "blockhunt" && (
          <button
            data-mobile-btn
            className={`absolute pointer-events-auto ${btnClass} bg-purple-500/60 border-2 border-purple-300/60 text-white`}
            style={{ width: BUTTON_SIZE - 8, height: BUTTON_SIZE - 8, left: 160, bottom: 50 }}
            onTouchStart={(e) => { e.preventDefault(); toggleDisguise(); }}
          >
            <span className="text-sm">📦</span>
          </button>
        )}
      </div>
    </>
  );
}
