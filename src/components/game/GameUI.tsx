import { useState, useEffect } from "react";

export default function GameUI() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsLocked(!!document.pointerLockElement);
    };
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  return (
    <>
      {/* Crosshair */}
      {isLocked && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full opacity-60 shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
        </div>
      )}

      {/* Start screen */}
      {!isLocked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              🏠 House Explorer
            </h1>
            <p className="text-lg text-white/60">
              A first-person 3D experience
            </p>
            <div className="space-y-3">
              <p className="text-white/90 text-lg font-medium">
                Click anywhere to start
              </p>
              <div className="flex gap-6 justify-center text-white/50 text-sm">
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">W A S D</kbd> Move</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Mouse</kbd> Look</span>
                <span><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">ESC</kbd> Pause</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
