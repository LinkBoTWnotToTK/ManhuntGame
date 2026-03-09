import { useEffect, useRef, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let raf: number;
    const loop = () => {
      frames.current++;
      const now = performance.now();
      if (now - last.current >= 1000) {
        setFps(frames.current);
        frames.current = 0;
        last.current = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = fps >= 50 ? "#0f0" : fps >= 30 ? "#ff0" : "#f00";

  return (
    <div
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        color,
        padding: "4px 10px",
        borderRadius: 6,
        fontFamily: "monospace",
        fontSize: 14,
        fontWeight: "bold",
        pointerEvents: "none",
      }}
    >
      {fps} FPS
    </div>
  );
}
