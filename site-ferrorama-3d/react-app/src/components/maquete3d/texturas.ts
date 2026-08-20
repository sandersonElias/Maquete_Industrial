import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function ruido(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * alpha * 255;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function criar(
  chave: string,
  w: number,
  h: number,
  desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 4,
  repeatY = 4
): THREE.CanvasTexture {
  const hit = cache.get(chave);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  desenhar(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cache.set(chave, tex);
  return tex;
}

export function texGrama() {
  return criar('grama', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a6840';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4200; i++) {
      const s = 3 + Math.random() * 9;
      ctx.fillStyle = Math.random() > 0.55 ? '#4f7d45' : Math.random() > 0.5 ? '#2d552c' : '#5a8a4a';
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s * (0.4 + Math.random() * 0.5));
    }
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = 'rgba(90, 70, 40, 0.12)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 28, 10 + Math.random() * 16, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ruido(ctx, w, h, 0.07);
  }, 10, 8);
}

export function texAsfalto() {
  return criar('asfalto', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a3d42';
    ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 0.16);
    ctx.strokeStyle = 'rgba(220,210,160,0.35)';
    ctx.lineWidth = 5;
    ctx.setLineDash([32, 26]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }, 1, 1);
}

export function texConcreto() {
  return criar('concreto', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8d9298';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(50,50,55,0.18)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ruido(ctx, w, h, 0.11);
  }, 4, 4);
}

export function texAgua() {
  return criar('agua', 512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#15607c');
    g.addColorStop(0.35, '#1f7a96');
    g.addColorStop(0.7, '#2a8eaa');
    g.addColorStop(1, '#0e4a62');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(190,235,255,0.22)';
    ctx.lineWidth = 2;
    for (let y = 8; y < h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 10) {
        ctx.lineTo(x, y + Math.sin(x * 0.07 + y * 0.05) * 5);
      }
      ctx.stroke();
    }
    ruido(ctx, w, h, 0.05);
  }, 2, 3);
}

export function texPista() {
  return criar('pista', 256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2c3036';
    ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 0.1);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(10, 0, 12, h);
    ctx.fillRect(w - 22, 0, 12, h);
    ctx.fillStyle = '#e8ecf0';
    for (let y = 12; y < h; y += 44) {
      ctx.fillRect(w * 0.45, y, w * 0.1, 20);
    }
  }, 1, 4);
}

export function texMetal() {
  return criar('metal', 128, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#c5ced6');
    g.addColorStop(0.5, '#9aa5b0');
    g.addColorStop(1, '#d0d6dc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ruido(ctx, w, h, 0.06);
  }, 2, 8);
}

export function texMadeira() {
  return criar('madeira', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? '#4a3428' : '#6a4c38';
      ctx.fillRect(0, y, w, 7);
    }
    ruido(ctx, w, h, 0.07);
  }, 1, 4);
}

export function texLastro() {
  return criar('lastro', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#5c5348';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#6a6258' : '#4a443c';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 5, 3);
    }
  }, 6, 6);
}

export function texTerra() {
  return criar('terra', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#6a5238' : '#4a3828';
      ctx.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 3);
    }
    ruido(ctx, w, h, 0.1);
  }, 4, 4);
}

export function texRocha() {
  return criar('rocha', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5a4634';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#6a5640' : '#4a3828';
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 28, 8 + Math.random() * 18, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    ruido(ctx, w, h, 0.12);
  }, 3, 3);
}
