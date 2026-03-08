import { useGame, GAME_MODES } from "./GameState";
import { useState, useEffect, useRef } from "react";

interface TutorialTask {
  check: string; // key to check
  label: string;
}

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Hide & Seek!",
    emoji: "👋",
    text: "This interactive tutorial will teach you the basics. Complete each task to proceed!",
    highlight: null,
    task: null,
  },
  {
    title: "Movement — WASD",
    emoji: "🏃",
    text: "Use W/A/S/D to move around. Try pressing each key now!",
    highlight: "movement",
    task: { check: "movement", label: "Press W, A, S, and D" } as TutorialTask,
  },
  {
    title: "Sprinting — SHIFT",
    emoji: "💨",
    text: "Hold SHIFT while moving to sprint. Your stamina bar is at the bottom-left.",
    highlight: "sprint",
    task: { check: "sprint", label: "Hold SHIFT to sprint" } as TutorialTask,
  },
  {
    title: "Jumping — SPACE",
    emoji: "🦘",
    text: "Press SPACE to jump. Press it again mid-air for a DOUBLE JUMP!",
    highlight: "jump",
    task: { check: "jump", label: "Press SPACE twice to double jump" } as TutorialTask,
  },
  {
    title: "Camera & Aiming",
    emoji: "🎯",
    text: "Move your mouse to look around. The crosshair shows where you're aiming.",
    highlight: "camera",
    task: { check: "mouse", label: "Move your mouse around" } as TutorialTask,
  },
  {
    title: "Runner Weapons",
    emoji: "🪃",
    text: "Press 1 for Slingshot, 2 for Scatter Shot, 3 for Sniper. Try switching!",
    highlight: "weapons",
    task: { check: "weapon_switch", label: "Press 1, 2, or 3 to switch weapons" } as TutorialTask,
  },
  {
    title: "Grabbing Objects — E",
    emoji: "📦",
    text: "Press E near objects to grab them. Moving objects can reveal hidden hatches!",
    highlight: "grab",
    task: { check: "grab", label: "Press E to interact" } as TutorialTask,
  },
  {
    title: "Underground Hatches",
    emoji: "🕳️",
    text: "Glowing circles on the ground are hatches. Press E to go underground. There are supplies below!",
    highlight: "hatch",
    task: null,
  },
  {
    title: "Escape Portal",
    emoji: "🚪",
    text: "As a Runner, survive until the portal opens. Run to the green portal to win!",
    highlight: "escape",
    task: null,
  },
  {
    title: "Game Modes",
    emoji: "🎮",
    text: `There are ${Object.keys(GAME_MODES).length} modes! Classic, Parkour, Block Hunt, CTF, Survival, and more!`,
    highlight: "modes",
    task: null,
  },
  {
    title: "Campaign Mode",
    emoji: "🎖️",
    text: "Play Campaign from the main menu to unlock challenge levels with increasing difficulty and earn bonus rewards!",
    highlight: null,
    task: null,
  },
  {
    title: "You're Ready!",
    emoji: "🏆",
    text: "You've completed the tutorial! Head to the menu and start a match or try the Campaign!",
    highlight: null,
    task: null,
  },
];

export default function Tutorial() {
  const { tutorialActive, tutorialStep, advanceTutorial, endTutorial } = useGame();
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const keysPressed = useRef(new Set<string>());
  const mouseMoved = useRef(0);

  // Track keyboard/mouse for interactive tasks
  useEffect(() => {
    if (!tutorialActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);

      const step = TUTORIAL_STEPS[tutorialStep];
      if (!step?.task) return;

      if (step.task.check === "movement") {
        const has = (k: string) => keysPressed.current.has(k);
        if (has("KeyW") && has("KeyA") && has("KeyS") && has("KeyD")) {
          setTaskProgress(prev => ({ ...prev, movement: true }));
        }
      }
      if (step.task.check === "sprint" && (e.code === "ShiftLeft" || e.code === "ShiftRight")) {
        setTaskProgress(prev => ({ ...prev, sprint: true }));
      }
      if (step.task.check === "jump" && e.code === "Space") {
        // Count jumps
        const count = (keysPressed.current.has("_jump_count") ? 2 : 1);
        keysPressed.current.add("_jump_count");
        if (count >= 2) {
          setTaskProgress(prev => ({ ...prev, jump: true }));
        }
      }
      if (step.task.check === "weapon_switch" && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3")) {
        setTaskProgress(prev => ({ ...prev, weapon_switch: true }));
      }
      if (step.task.check === "grab" && e.code === "KeyE") {
        setTaskProgress(prev => ({ ...prev, grab: true }));
      }
    };

    const onMouseMove = () => {
      mouseMoved.current++;
      const step = TUTORIAL_STEPS[tutorialStep];
      if (step?.task?.check === "mouse" && mouseMoved.current > 20) {
        setTaskProgress(prev => ({ ...prev, mouse: true }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [tutorialActive, tutorialStep]);

  // Reset tracking on step change
  useEffect(() => {
    keysPressed.current.clear();
    mouseMoved.current = 0;
  }, [tutorialStep]);

  if (!tutorialActive) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  if (!step) {
    endTutorial();
    return null;
  }

  const isLast = tutorialStep >= TUTORIAL_STEPS.length - 1;
  const progress = ((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100;
  const hasTask = !!step.task;
  const taskDone = hasTask ? !!taskProgress[step.task!.check] : true;
  const canAdvance = !hasTask || taskDone;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => canAdvance && (isLast ? endTutorial() : advanceTutorial())}>
      <div className="max-w-md w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-cyan-400/60 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/98 rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-2">{step.emoji}</div>
            <h2 className="text-xl font-black text-white tracking-tight">{step.title}</h2>
          </div>

          <p className="text-white/60 text-sm leading-relaxed text-center">{step.text}</p>

          {/* Visual hints */}
          {step.highlight === "movement" && (
            <div className="flex justify-center gap-1">
              {["W","A","S","D"].map(k => {
                const pressed = keysPressed.current.has(`Key${k}`);
                return (
                  <kbd key={k} className={`w-8 h-8 flex items-center justify-center rounded-lg font-mono text-sm border transition-all ${
                    pressed ? "bg-green-500/30 border-green-400/50 text-green-300" : "bg-white/10 border-white/20 text-white/70"
                  }`}>{k}</kbd>
                );
              })}
            </div>
          )}
          {step.highlight === "sprint" && (
            <div className="flex justify-center">
              <kbd className={`px-6 h-8 flex items-center justify-center rounded-lg font-mono text-xs border transition-all ${
                taskProgress.sprint ? "bg-green-500/30 border-green-400/50 text-green-300" : "bg-white/10 border-white/20 text-white/70"
              }`}>SHIFT</kbd>
            </div>
          )}
          {step.highlight === "jump" && (
            <div className="flex justify-center">
              <kbd className={`px-6 h-8 flex items-center justify-center rounded-lg font-mono text-xs border transition-all ${
                taskProgress.jump ? "bg-green-500/30 border-green-400/50 text-green-300" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
              }`}>SPACE × 2</kbd>
            </div>
          )}
          {step.highlight === "weapons" && (
            <div className="flex justify-center gap-2">
              {[["1","🪃","Sling"],["2","💥","Scatter"],["3","🎯","Sniper"]].map(([k,e,n]) => (
                <div key={k} className={`rounded-lg px-3 py-2 border text-center transition-all ${
                  taskProgress.weapon_switch ? "bg-green-500/10 border-green-400/20" : "bg-white/5 border-white/10"
                }`}>
                  <kbd className="text-[10px] text-white/50 font-mono">{k}</kbd>
                  <div className="text-lg">{e}</div>
                  <div className="text-[9px] text-white/30">{n}</div>
                </div>
              ))}
            </div>
          )}

          {/* Task indicator */}
          {hasTask && (
            <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              taskDone
                ? "bg-green-950/50 border-green-500/30"
                : "bg-yellow-950/30 border-yellow-500/20 animate-pulse"
            }`}>
              <span className="text-sm">{taskDone ? "✅" : "⏳"}</span>
              <span className={`text-xs font-bold ${taskDone ? "text-green-400" : "text-yellow-300"}`}>
                {taskDone ? "Task Complete!" : step.task!.label}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-white/20 text-[10px]">{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
            <button
              onClick={() => canAdvance && (isLast ? endTutorial() : advanceTutorial())}
              disabled={!canAdvance}
              className={`px-5 py-2 rounded-xl border text-sm font-bold transition-all ${
                canAdvance
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20 hover:scale-105 active:scale-95"
                  : "bg-white/5 text-white/20 border-white/5 cursor-not-allowed"
              }`}>
              {isLast ? "🎮 Start Playing!" : canAdvance ? "Next →" : "Complete task ↑"}
            </button>
          </div>
        </div>

        <button onClick={endTutorial}
          className="mt-3 text-white/20 text-xs hover:text-white/40 transition-colors block mx-auto">
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}

export { TUTORIAL_STEPS };
