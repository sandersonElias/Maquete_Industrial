import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../lib/motion';

class Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.size = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.opacity = 0;
    this.color = '';
    this.reset();
  }

  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.5;
    this.speedY = (Math.random() - 0.5) * 0.5;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.5 ? '#ff8844' : '#cc6600';
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
      this.reset();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // Movimento reduzido: nada de partículas animadas no fundo
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles: Particle[] = [];
    let animationId = 0;
    let running = false;

    // Canvas em resolução de dispositivo para não ficar borrado em telas retina
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Menos partículas em telas pequenas — o custo é O(n²) nas conexões
    const count = window.innerWidth < 768 ? 24 : 50;
    for (let i = 0; i < count; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(p => { p.update(); p.draw(ctx); });
      // Conexões entre partículas próximas — limita checagem para reduzir custo
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = '#ff8844';
            ctx.globalAlpha = 0.1 * (1 - dist / 130);
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    // `running` evita empilhar dois loops de rAF se o evento disparar duas vezes
    const start = () => {
      if (running) return;
      running = true;
      animationId = requestAnimationFrame(animate);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(animationId);
    };

    start();

    const handleVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [reduced]);

  if (reduced) return null;

  return <canvas ref={canvasRef} id="particles" aria-hidden="true" />;
}
