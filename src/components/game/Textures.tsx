import * as THREE from "three";

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

export function createWallTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#c8bfb0";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const v = Math.random() * 30 - 15;
      ctx.fillStyle = `rgba(${128 + v}, ${120 + v}, ${110 + v}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }
  }, 2, 2);
}

export function createFloorTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#6d5a42";
    ctx.fillRect(0, 0, w, h);
    const plankH = h / 6;
    for (let i = 0; i < 6; i++) {
      const y = i * plankH;
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${109 + shade}, ${90 + shade}, ${66 + shade})`;
      ctx.fillRect(0, y + 1, w, plankH - 2);
      ctx.fillStyle = "rgba(40, 30, 20, 0.4)";
      ctx.fillRect(0, y, w, 1);
    }
  }, 3, 3);
}

export function createGrassTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#2a5420";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const shade = Math.random() * 40 - 20;
      ctx.fillStyle = `rgb(${42 + shade}, ${84 + shade}, ${32 + shade})`;
      ctx.fillRect(x, y, 1, 3);
    }
  }, 8, 8);
}

export function createConcreteTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#7a7a7a";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1000; i++) {
      const v = Math.random() * 30 - 15;
      ctx.fillStyle = `rgba(${122 + v}, ${122 + v}, ${122 + v}, 0.25)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, 2, 2);
}

export function createBrickTexture() {
  return createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#5a3a20";
    ctx.fillRect(0, 0, w, h);
    const bw = w / 4;
    const bh = h / 6;
    for (let row = 0; row < 6; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let col = -1; col < 5; col++) {
        const x = col * bw + offset;
        const y = row * bh;
        const shade = Math.random() * 30 - 15;
        ctx.fillStyle = `rgb(${122 + shade}, ${58 + shade}, ${16 + shade})`;
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    }
  }, 2, 2);
}

export function createCrateTexture() {
  return createCanvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#8a6a45";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(60, 40, 20, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(w - 4, h - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 4, 4); ctx.lineTo(4, h - 4); ctx.stroke();
  }, 1, 1);
}

export function createFenceTexture() {
  return createCanvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#5a4810";
    ctx.fillRect(0, 0, w, h);
    const slats = 4;
    const sw = w / slats;
    for (let i = 0; i < slats; i++) {
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${90 + shade}, ${72 + shade}, ${16 + shade})`;
      ctx.fillRect(i * sw + 1, 0, sw - 2, h);
    }
  }, 4, 1);
}

export function createDarkWoodTexture() {
  return createCanvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#4a2e15";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 200; i++) {
      const shade = Math.random() * 20 - 10;
      ctx.fillStyle = `rgba(${74 + shade}, ${46 + shade}, ${21 + shade}, 0.15)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 6);
    }
  }, 2, 2);
}

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
