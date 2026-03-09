import * as THREE from "three";

// Helper to create a canvas-based texture
function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  return tex;
}

// ---- WALL TEXTURE: stucco/plaster with subtle cracks ----
export function createWallTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#c8bfb0";
    ctx.fillRect(0, 0, w, h);
    // Noise grain
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const v = Math.random() * 30 - 15;
      ctx.fillStyle = `rgba(${128 + v}, ${120 + v}, ${110 + v}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Subtle cracks
    ctx.strokeStyle = "rgba(100, 90, 80, 0.15)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let cx = Math.random() * w, cy = Math.random() * h;
      ctx.moveTo(cx, cy);
      for (let j = 0; j < 8; j++) {
        cx += (Math.random() - 0.5) * 30;
        cy += (Math.random() - 0.5) * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
  }, 2, 2);
}

// ---- FLOOR TEXTURE: wood planks ----
export function createFloorTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#6d5a42";
    ctx.fillRect(0, 0, w, h);
    const plankH = h / 8;
    for (let i = 0; i < 8; i++) {
      const y = i * plankH;
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${109 + shade}, ${90 + shade}, ${66 + shade})`;
      ctx.fillRect(0, y + 1, w, plankH - 2);
      // Wood grain
      ctx.strokeStyle = `rgba(80, 60, 40, 0.15)`;
      ctx.lineWidth = 0.5;
      for (let g = 0; g < 6; g++) {
        const gy = y + 3 + Math.random() * (plankH - 6);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        for (let x = 0; x < w; x += 10) {
          ctx.lineTo(x, gy + Math.sin(x * 0.05) * 2);
        }
        ctx.stroke();
      }
      // Gap line
      ctx.fillStyle = "rgba(40, 30, 20, 0.4)";
      ctx.fillRect(0, y, w, 1);
    }
  }, 3, 3);
}

// ---- GRASS TEXTURE ----
export function createGrassTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#2a5420";
    ctx.fillRect(0, 0, w, h);
    // Blades
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const shade = Math.random() * 40 - 20;
      ctx.fillStyle = `rgb(${42 + shade}, ${84 + shade}, ${32 + shade})`;
      ctx.fillRect(x, y, 1, 3 + Math.random() * 3);
    }
    // Dark patches
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = "rgba(20, 40, 15, 0.2)";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 8, 8);
}

// ---- CONCRETE TEXTURE ----
export function createConcreteTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#7a7a7a";
    ctx.fillRect(0, 0, w, h);
    // Noise
    for (let i = 0; i < 4000; i++) {
      const v = Math.random() * 30 - 15;
      ctx.fillStyle = `rgba(${122 + v}, ${122 + v}, ${122 + v}, 0.25)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // Stains
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "rgba(60, 60, 60, 0.1)";
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 15 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2, 2);
}

// ---- BRICK TEXTURE ----
export function createBrickTexture() {
  return createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#5a3a20"; // mortar
    ctx.fillRect(0, 0, w, h);
    const bw = w / 4;
    const bh = h / 8;
    for (let row = 0; row < 8; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let col = -1; col < 5; col++) {
        const x = col * bw + offset;
        const y = row * bh;
        const shade = Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${122 + shade}, ${58 + shade}, ${16 + shade})`;
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        // Brick texture noise
        for (let n = 0; n < 20; n++) {
          ctx.fillStyle = `rgba(${100 + shade}, ${50 + shade}, ${20}, 0.15)`;
          ctx.fillRect(x + 2 + Math.random() * (bw - 4), y + 2 + Math.random() * (bh - 4), 3, 2);
        }
      }
    }
  }, 2, 2);
}

// ---- CRATE TEXTURE ----
export function createCrateTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(0, 0, w, h);
    // Planks
    ctx.strokeStyle = "rgba(60, 40, 20, 0.4)";
    ctx.lineWidth = 2;
    const planks = 4;
    for (let i = 1; i < planks; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / planks) * i);
      ctx.lineTo(w, (h / planks) * i);
      ctx.stroke();
    }
    // Cross brace
    ctx.strokeStyle = "rgba(50, 30, 15, 0.5)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(w - 8, h - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 8, 8);
    ctx.lineTo(8, h - 8);
    ctx.stroke();
    // Corner nails
    ctx.fillStyle = "#666";
    [
      [8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    // Wood grain
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(${70 + Math.random() * 30}, ${50 + Math.random() * 20}, ${25}, 0.08)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 4);
    }
  }, 1, 1);
}

// ---- FENCE TEXTURE: vertical slats ----
export function createFenceTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#5a4810";
    ctx.fillRect(0, 0, w, h);
    const slats = 6;
    const sw = w / slats;
    for (let i = 0; i < slats; i++) {
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${90 + shade}, ${72 + shade}, ${16 + shade})`;
      ctx.fillRect(i * sw + 1, 0, sw - 2, h);
      // Grain
      ctx.strokeStyle = `rgba(50, 40, 10, 0.12)`;
      ctx.lineWidth = 0.5;
      for (let g = 0; g < 4; g++) {
        const gx = i * sw + 3 + Math.random() * (sw - 6);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + (Math.random() - 0.5) * 4, h);
        ctx.stroke();
      }
    }
  }, 4, 1);
}

// ---- DARK WOOD TEXTURE ----
export function createDarkWoodTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#4a2e15";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgba(${74 + shade}, ${46 + shade}, ${21 + shade}, 0.15)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 6 + Math.random() * 8);
    }
  }, 2, 2);
}

// ---- Build all materials with textures ----
export function createTexturedMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({ map: createWallTexture(), roughness: 0.85, metalness: 0.02 }),
    floor: new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 0.75, metalness: 0.05 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#e8e0d5", roughness: 0.95 }),
    darkWood: new THREE.MeshStandardMaterial({ map: createDarkWoodTexture(), roughness: 0.65, metalness: 0.05 }),
    fabric: new THREE.MeshStandardMaterial({ color: "#5a3c2e", roughness: 0.92 }),
    cushion: new THREE.MeshStandardMaterial({ color: "#b83e28", roughness: 0.85 }),
    metal: new THREE.MeshStandardMaterial({ color: "#999", metalness: 0.9, roughness: 0.2 }),
    counter: new THREE.MeshStandardMaterial({ color: "#ccc8be", roughness: 0.35, metalness: 0.15 }),
    concrete: new THREE.MeshStandardMaterial({ map: createConcreteTexture(), roughness: 0.8, metalness: 0.05 }),
    grass: new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.95 }),
    fence: new THREE.MeshStandardMaterial({ map: createFenceTexture(), roughness: 0.75, metalness: 0.1 }),
    crate: new THREE.MeshStandardMaterial({ map: createCrateTexture(), roughness: 0.7, metalness: 0.05 }),
    brick: new THREE.MeshStandardMaterial({ map: createBrickTexture(), roughness: 0.9 }),
    escapeClosed: new THREE.MeshStandardMaterial({ color: "#660000", roughness: 0.5, emissive: "#330000", emissiveIntensity: 0.5 }),
    escapeOpen: new THREE.MeshStandardMaterial({ color: "#00ff44", roughness: 0.05, emissive: "#00ff44", emissiveIntensity: 3, transparent: true, opacity: 0.85 }),
  };
}
