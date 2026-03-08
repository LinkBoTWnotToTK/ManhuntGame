import { useGame, GAME_MODES } from "./GameState";

const TUTORIAL_STEPS = [
  {
    title: "Welcome to Hide & Seek!",
    emoji: "👋",
    text: "This tutorial will teach you everything you need to know. Click anywhere or press any key to continue.",
    highlight: null,
  },
  {
    title: "Movement — WASD",
    emoji: "🏃",
    text: "Use W/A/S/D to move around. Hold SHIFT to sprint (uses stamina). Your stamina bar is at the bottom-left.",
    highlight: "movement",
  },
  {
    title: "Jumping — SPACE",
    emoji: "🦘",
    text: "Press SPACE to jump. You can DOUBLE JUMP by pressing SPACE again mid-air. Great for parkour mode!",
    highlight: "jump",
  },
  {
    title: "Wall Running",
    emoji: "🧗",
    text: "Run toward a wall while moving forward + airborne to wall-run along it. Press SPACE during a wall-run to wall-jump away!",
    highlight: "wallrun",
  },
  {
    title: "Camera & Aiming",
    emoji: "🎯",
    text: "Move your mouse to look around. Click the game area to lock your cursor. The crosshair shows where you're aiming.",
    highlight: "camera",
  },
  {
    title: "Runner Weapons",
    emoji: "🪃",
    text: "As a Runner, press 1 for Slingshot (accurate), 2 for Scatter Shot (spread), 3 for Sniper (long range). Left-click to fire!",
    highlight: "weapons",
  },
  {
    title: "Hunter Melee",
    emoji: "⚔️",
    text: "As a Hunter, left-click to melee attack. Get close to runners and tag them! You have allies (green eyes) that help you hunt.",
    highlight: "melee",
  },
  {
    title: "Grabbing Objects — E",
    emoji: "📦",
    text: "Press E near crates, barrels, or boxes to grab and carry them. Moving objects can reveal hidden hatches leading underground!",
    highlight: "grab",
  },
  {
    title: "Underground Hatches",
    emoji: "🕳️",
    text: "When you see a glowing circle on the ground, press E to go underground. These bases have supplies! Press E on the green circle inside to return.",
    highlight: "hatch",
  },
  {
    title: "Escape Portal",
    emoji: "🚪",
    text: "As a Runner, survive until the timer runs out and the escape portal opens. Run to the glowing green portal to win!",
    highlight: "escape",
  },
  {
    title: "Game Modes",
    emoji: "🎮",
    text: `There are ${Object.keys(GAME_MODES).length} modes! Classic, Parkour (jump across platforms), Block Hunt (disguise as objects with Q), CTF (capture the flag), Survival (waves), and more!`,
    highlight: "modes",
  },
  {
    title: "Skins & Shop",
    emoji: "🛒",
    text: "Earn coins by playing matches. Spend them in the Shop on powerups, skins, trails, and hats. Prestige at level 10 for permanent multipliers!",
    highlight: "shop",
  },
  {
    title: "You're Ready!",
    emoji: "🏆",
    text: "That's everything! Head back to the menu and start a match. Good luck out there!",
    highlight: null,
  },
];

export default function Tutorial() {
  const { tutorialActive, tutorialStep, advanceTutorial, endTutorial } = useGame();

  if (!tutorialActive) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  if (!step) {
    endTutorial();
    return null;
  }

  const isLast = tutorialStep >= TUTORIAL_STEPS.length - 1;
  const progress = ((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => isLast ? endTutorial() : advanceTutorial()}>
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

          {/* Visual hints per step */}
          {step.highlight === "movement" && (
            <div className="flex justify-center gap-1">
              {["W","A","S","D"].map(k => (
                <kbd key={k} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white/70 font-mono text-sm border border-white/20">{k}</kbd>
              ))}
              <span className="mx-2 text-white/30 self-center">+</span>
              <kbd className="px-3 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white/70 font-mono text-xs border border-white/20">SHIFT</kbd>
            </div>
          )}
          {step.highlight === "jump" && (
            <div className="flex justify-center">
              <kbd className="px-6 h-8 flex items-center justify-center bg-cyan-500/20 rounded-lg text-cyan-300 font-mono text-xs border border-cyan-500/30">SPACE × 2</kbd>
            </div>
          )}
          {step.highlight === "weapons" && (
            <div className="flex justify-center gap-2">
              {[["1","🪃","Sling"],["2","💥","Scatter"],["3","🎯","Sniper"]].map(([k,e,n]) => (
                <div key={k} className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 text-center">
                  <kbd className="text-[10px] text-white/50 font-mono">{k}</kbd>
                  <div className="text-lg">{e}</div>
                  <div className="text-[9px] text-white/30">{n}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-white/20 text-[10px]">{tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
            <button
              onClick={() => isLast ? endTutorial() : advanceTutorial()}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-sm font-bold transition-all hover:scale-105 active:scale-95">
              {isLast ? "🎮 Start Playing!" : "Next →"}
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
