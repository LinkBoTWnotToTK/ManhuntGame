import { useState, useRef, useCallback, useEffect } from "react";
import { isMobilePlatform, mobileInput } from "./SharedState";

// ========== Virtual Joystick ==========
function VirtualJoystick() {
  const [active, setActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const touchId = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const RADIUS = 50;

  const handleStart = useCallback((e: React.TouchEvent) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    const rect = baseRef.current?.getBoundingClientRect();
    if (rect) {
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    setActive(true);
    setStickPos({ x: 0, y: 0 });
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    if (touchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchId.current) {
        let dx = touch.clientX - centerRef.current.x;
        let dy = touch.clientY - centerRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > RADIUS) {
          dx = (dx / dist) * RADIUS;
          dy = (dy / dist) * RADIUS;
        }
        setStickPos({ x: dx, y: dy });
        // Update global mobile input
        mobileInput.moveX = dx / RADIUS;
        mobileInput.moveY = dy / RADIUS;
      }
    }
  }, []);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        touchId.current = null;
        setActive(false);
        setStickPos({ x: 0, y: 0 });
        mobileInput.moveX = 0;
        mobileInput.moveY = 0;
      }
    }
  }, []);

  return (
    <div
      ref={baseRef}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm touch-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="absolute w-14 h-14 rounded-full bg-white/30 border border-white/40 shadow-lg transition-none"
        style={{
          left: `calc(50% + ${stickPos.x}px - 28px)`,
          top: `calc(50% + ${stickPos.y}px - 28px)`,
          opacity: active ? 1 : 0.6,
        }}
      />
    </div>
  );
}

// ========== Action Button ==========
function ActionButton({
  emoji,
  label,
  onPress,
  onRelease,
  className = "",
  size = "lg",
  active = false,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  onRelease?: () => void;
  className?: string;
  size?: "sm" | "lg";
  active?: boolean;
}) {
  const dim = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onTouchEnd={(e) => { e.preventDefault(); onRelease?.(); }}
      onTouchCancel={(e) => { e.preventDefault(); onRelease?.(); }}
      className={`${dim} rounded-full flex flex-col items-center justify-center touch-none select-none ${
        active
          ? "bg-white/30 border-2 border-white/50"
          : "bg-white/10 border-2 border-white/20"
      } backdrop-blur-sm ${className}`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="text-[7px] text-white/60 font-bold mt-0.5">{label}</span>
    </button>
  );
}

// ========== Camera Swipe Area ==========
function CameraSwipe() {
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const touchId = useRef<number | null>(null);

  const handleStart = useCallback((e: React.TouchEvent) => {
    // Only use touches on the right half of screen
    const touch = e.changedTouches[0];
    if (touch.clientX < window.innerWidth * 0.4) return;
    if (touchId.current !== null) return;
    touchId.current = touch.identifier;
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    if (touchId.current === null || !lastTouch.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchId.current) {
        const dx = touch.clientX - lastTouch.current.x;
        const dy = touch.clientY - lastTouch.current.y;
        mobileInput.cameraX += dx * 0.005;
        mobileInput.cameraY += dy * 0.005;
        lastTouch.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        touchId.current = null;
        lastTouch.current = null;
      }
    }
  }, []);

  return (
    <div
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      className="absolute inset-0 z-30 touch-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    />
  );
}

// ========== Main Mobile Controls Overlay ==========
export default function MobileControls({ role, currentWeapon, onSwitchWeapon, gameMode }: {
  role: string | null;
  currentWeapon: string;
  onSwitchWeapon: (w: string) => void;
  gameMode: string;
}) {
  if (!isMobilePlatform) return null;

  const [sprintActive, setSprintActive] = useState(false);

  return (
    <div className="fixed inset-0 z-45 pointer-events-none">
      {/* Camera swipe area — full screen, behind buttons */}
      <div className="pointer-events-auto">
        <CameraSwipe />
      </div>

      {/* Joystick — bottom left */}
      <div className="pointer-events-auto">
        <VirtualJoystick />
      </div>

      {/* Right side buttons */}
      <div className="absolute bottom-8 right-6 flex flex-col items-center gap-3 pointer-events-auto">
        {/* Attack */}
        <ActionButton
          emoji={role === "hunter" ? "⚔️" : "🎯"}
          label={role === "hunter" ? "HIT" : "FIRE"}
          onPress={() => { mobileInput.attack = true; }}
          onRelease={() => { mobileInput.attack = false; }}
          size="lg"
          className="bg-red-500/20 border-red-500/30"
        />

        {/* Jump */}
        <ActionButton
          emoji="⬆"
          label="JUMP"
          onPress={() => { mobileInput.jump = true; }}
          onRelease={() => { mobileInput.jump = false; }}
          size="lg"
        />

        {/* Sprint */}
        <ActionButton
          emoji="💨"
          label="RUN"
          onPress={() => { mobileInput.sprint = true; setSprintActive(true); }}
          onRelease={() => { mobileInput.sprint = false; setSprintActive(false); }}
          size="sm"
          active={sprintActive}
        />

        {/* Interact */}
        <ActionButton
          emoji="🤚"
          label="USE"
          onPress={() => { mobileInput.interact = true; }}
          onRelease={() => { mobileInput.interact = false; }}
          size="sm"
        />

        {/* Block Hunt disguise */}
        {gameMode === "blockhunt" && (
          <ActionButton
            emoji="📦"
            label="HIDE"
            onPress={() => { mobileInput.disguise = true; }}
            onRelease={() => { mobileInput.disguise = false; }}
            size="sm"
          />
        )}
      </div>

      {/* Weapon switcher — bottom center-right, above action buttons */}
      {role === "runner" && (
        <div className="absolute bottom-44 right-4 flex gap-2 pointer-events-auto">
          {([["🪃", "slingshot"], ["💥", "shotgun"], ["🎯", "sniper"]] as const).map(([emoji, id]) => (
            <button
              key={id}
              onTouchStart={(e) => { e.preventDefault(); onSwitchWeapon(id); }}
              className={`w-11 h-11 rounded-xl flex items-center justify-center touch-none select-none ${
                currentWeapon === id
                  ? "bg-white/20 border-2 border-white/40"
                  : "bg-white/5 border border-white/10"
              } backdrop-blur-sm`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== Platform Selector ==========
export function PlatformSelector({ onSelect }: { onSelect: (mobile: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(10,10,30,0.99) 0%, rgba(0,0,10,1) 100%)" }}>
      <div className="text-center space-y-8 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
          HIDE & SEEK
        </h1>
        <p className="text-white/40 text-sm">How are you playing?</p>
        <div className="flex gap-5 justify-center">
          <button
            onClick={() => onSelect(false)}
            className="group p-8 bg-gradient-to-b from-blue-900/40 to-blue-950/60 text-white rounded-2xl border border-blue-500/20 hover:border-blue-400/50 transition-all hover:scale-105 active:scale-95 space-y-3 w-44"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">🖥️</div>
            <div className="text-lg font-black">DESKTOP</div>
            <div className="text-[10px] text-white/30">Keyboard + Mouse</div>
          </button>
          <button
            onClick={() => onSelect(true)}
            className="group p-8 bg-gradient-to-b from-green-900/40 to-green-950/60 text-white rounded-2xl border border-green-500/20 hover:border-green-400/50 transition-all hover:scale-105 active:scale-95 space-y-3 w-44"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">📱</div>
            <div className="text-lg font-black">MOBILE</div>
            <div className="text-[10px] text-white/30">Touch Controls</div>
          </button>
        </div>
      </div>
    </div>
  );
}
