'use client';

import { useEffect, useRef } from 'react';

type Effect = 'mist' | 'aurora' | 'rain' | 'star' | 'petal' | 'bubble' | 'ember' | 'snow' | 'spark' | 'firefly' | 'leaf';
type Theme = { effect: Effect; colors: readonly string[]; count: number };
type Particle = { x: number; y: number; z: number; rotation: number; phase: number };

// Effects and colors adapted from the user-supplied Ambient themes.html.
const themes: Record<string, Theme> = {
  atlantic: { effect: 'mist', colors: ['#22d3ee', '#0ea5e9', '#14b8a6'], count: 3 },
  aurora: { effect: 'aurora', colors: ['#34d399', '#22d3ee', '#a78bfa'], count: 3 },
  nocturne: { effect: 'rain', colors: ['#ff2bd6', '#22d3ee'], count: 70 },
  cosmos: { effect: 'star', colors: ['#c4b5fd', '#ffffff', '#818cf8'], count: 160 },
  sakura: { effect: 'petal', colors: ['#f9a8c4', '#f472b6', '#fda4af', '#e879a9'], count: 40 },
  abyss: { effect: 'bubble', colors: ['#7dd3fc'], count: 36 },
  cinder: { effect: 'ember', colors: ['#ff7a2f', '#fbbf24', '#ef4444'], count: 70 },
  glacier: { effect: 'snow', colors: ['#e0f2fe'], count: 90 },
  solstice: { effect: 'spark', colors: ['#fcd34d', '#fbbf24', '#fff7d6'], count: 90 },
  meadow: { effect: 'firefly', colors: ['#bef264', '#fde047'], count: 40 },
  autumn: { effect: 'leaf', colors: ['#c2410c', '#f59e0b', '#b91c1c', '#d97706'], count: 34 },
  nightfall: { effect: 'mist', colors: ['#6366f1', '#3b82f6', '#8b5cf6'], count: 3 },
};

const TAU = Math.PI * 2;
const randomParticle = (): Particle => ({ x: Math.random(), y: Math.random(), z: Math.random(), rotation: Math.random() * TAU, phase: Math.random() * TAU });

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number, glow = false) {
  if (glow) {
    ctx.globalAlpha = alpha * .22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, theme: Theme, particles: Particle[], width: number, height: number, time: number, delta: number, scale: number) {
  ctx.clearRect(0, 0, width, height);
  const { effect, colors } = theme;

  if (effect === 'mist') {
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 3; index++) {
      const x = width * (.5 + .38 * Math.sin(time * .07 + index * 2.1));
      const y = height * (.45 + .3 * Math.cos(time * .05 + index * 3));
      const radius = Math.max(width, height) * .55;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `${colors[index]}55`);
      gradient.addColorStop(1, `${colors[index]}00`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  } else if (effect === 'aurora') {
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 3; index++) {
      const base = height * (.2 + .1 * index);
      const amplitude = height * .07;
      const bandHeight = height * .42;
      ctx.beginPath();
      for (let x = 0; x <= width + 18; x += 18) {
        const y = base + Math.sin(x * .006 / scale + time * .22 + index * 1.7) * amplitude + Math.sin(x * .013 / scale - time * .15 + index) * amplitude * .5;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let x = width + 18; x >= 0; x -= 18) ctx.lineTo(x, base + bandHeight + Math.sin(x * .004 / scale + time * .1 + index) * amplitude);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, base - amplitude, 0, base + bandHeight);
      gradient.addColorStop(0, `${colors[index]}00`);
      gradient.addColorStop(.25, `${colors[index]}66`);
      gradient.addColorStop(1, `${colors[index]}00`);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  } else {
    particles.forEach((particle, index) => {
      const color = colors[index % colors.length];
      const p = particle;
      switch (effect) {
        case 'petal':
        case 'leaf': {
          p.y += (.035 + .05 * p.z) * delta;
          p.x += (.012 + .02 * Math.sin(time * .8 + p.phase)) * delta;
          p.rotation += delta * (.4 + p.z);
          if (p.y > 1.05) { p.y = -.05; p.x = Math.random(); }
          if (p.x > 1.05) p.x = -.05;
          const size = (5 + 11 * p.z) * scale;
          ctx.globalAlpha = .45 + .45 * p.z;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.ellipse(p.x * width, p.y * height, size, size * (effect === 'leaf' ? .45 : .55), p.rotation, 0, TAU);
          ctx.fill();
          break;
        }
        case 'ember': {
          p.y -= (.03 + .06 * p.z) * delta;
          p.x += Math.sin(time + p.phase) * .01 * delta;
          if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
          dot(ctx, p.x * width, p.y * height, (1 + 2.2 * p.z) * scale, color, Math.max(0, Math.min(1, p.y * 1.4)), true);
          break;
        }
        case 'star': {
          p.x = (p.x + .002 * delta + 1) % 1;
          dot(ctx, p.x * width, p.y * height, (.6 + 1.6 * p.z) * scale, color, .35 + .65 * Math.abs(Math.sin(time * (.6 + p.z) + p.phase)), p.z > .85);
          break;
        }
        case 'firefly': {
          p.rotation += Math.sin(time * .5 + p.phase) * delta;
          p.x = (p.x + Math.cos(p.rotation) * .02 * delta + 1) % 1;
          p.y = (p.y + Math.sin(p.rotation) * .02 * delta + 1) % 1;
          dot(ctx, p.x * width, p.y * height, (1.4 + 1.6 * p.z) * scale, color, .2 + .8 * Math.pow(Math.sin(time * 1.2 + p.phase) * .5 + .5, 2), true);
          break;
        }
        case 'snow': {
          p.y += (.03 + .05 * p.z) * delta;
          p.x += Math.sin(time * .6 + p.phase) * .008 * delta;
          if (p.y > 1.03) { p.y = -.03; p.x = Math.random(); }
          dot(ctx, p.x * width, p.y * height, (.8 + 1.8 * p.z) * scale, color, .35 + .5 * p.z);
          break;
        }
        case 'bubble': {
          p.y -= (.025 + .045 * p.z) * delta;
          p.x += Math.sin(time * .7 + p.phase) * .01 * delta;
          if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
          ctx.globalAlpha = .25 + .4 * p.z;
          ctx.strokeStyle = color;
          ctx.lineWidth = scale;
          ctx.beginPath();
          ctx.arc(p.x * width, p.y * height, (3 + 10 * p.z) * scale, 0, TAU);
          ctx.stroke();
          break;
        }
        case 'rain': {
          p.y += (.6 + .5 * p.z) * delta;
          p.x -= .03 * delta;
          if (p.y > 1.1) { p.y = -.1; p.x = Math.random() * 1.1; }
          const length = (14 + 22 * p.z) * scale;
          ctx.globalAlpha = .3 + .4 * p.z;
          ctx.strokeStyle = color;
          ctx.lineWidth = scale;
          ctx.beginPath();
          ctx.moveTo(p.x * width, p.y * height);
          ctx.lineTo(p.x * width - length * .12, p.y * height - length);
          ctx.stroke();
          break;
        }
        case 'spark': {
          p.y -= (.008 + .014 * p.z) * delta;
          p.x += .006 * delta;
          if (p.y < -.03) p.y = 1.03;
          if (p.x > 1.03) p.x = -.03;
          dot(ctx, p.x * width, p.y * height, (.7 + 1.5 * p.z) * scale, color, .2 + .8 * Math.abs(Math.sin(time * (.8 + p.z * 2) + p.phase)), p.z > .6);
          break;
        }
      }
    });
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touchScreen = window.matchMedia('(hover: none) and (pointer: coarse)');
    let frame = 0;
    let last = 0;
    let time = 5;
    let themeId = '';
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let scale = 1;

    const fit = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, touchScreen.matches ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      scale = touchScreen.matches ? .8 : 1;
    };

    const loop = (now: number) => {
      frame = window.requestAnimationFrame(loop);
      const interval = touchScreen.matches ? 1000 / 15 : 1000 / 24;
      if (now - last < interval) return;
      const delta = Math.min(.05, last ? (now - last) / 1000 : 0);
      last = now;
      time += delta;
      const theme = themes[themeId];
      if (theme) draw(ctx, theme, particles, width, height, time, delta, scale);
    };

    const sync = () => {
      const nextThemeId = root.dataset.theme ?? 'default';
      const theme = themes[nextThemeId];
      const active = Boolean(theme) && !root.classList.contains('ambient-particles-off') && !root.classList.contains('reduce-motion') && !reduceMotion.matches && !document.hidden;
      if (nextThemeId !== themeId) {
        themeId = nextThemeId;
        particles = theme ? Array.from({ length: Math.min(theme.count, touchScreen.matches ? 28 : 90) }, randomParticle) : [];
      }
      canvas.style.display = active ? 'block' : 'none';
      if (active && !frame) {
        fit();
        last = 0;
        frame = window.requestAnimationFrame(loop);
      } else if (!active && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const onResize = () => { if (frame) fit(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', sync);
    reduceMotion.addEventListener('change', sync);
    touchScreen.addEventListener('change', sync);
    sync();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', sync);
      reduceMotion.removeEventListener('change', sync);
      touchScreen.removeEventListener('change', sync);
    };
  }, []);

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />;
}
