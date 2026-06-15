import { useEffect, useRef } from 'react';
import './AnimatedWaves.css';

export default function AnimatedWaves({ darkMode = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!ctx || !parent) return;

    const LAYERS = [
      {
        baseRatio: 0.88,
        speed: 0.55,
        ampRatio: 1.0,
        phase: 0.0,
        fa: 1.8,
        fb: 3.3,
        fc: 4.7,
        glowWidth: 1.5,
        darkTop: 'rgba(99,102,241,0.28)',
        darkBot: 'rgba(99,102,241,0.0)',
        lightTop: 'rgba(139,92,246,0.13)',
        lightBot: 'rgba(139,92,246,0.0)',
        glowDark: 'rgba(129,140,248,0.7)',
        glowLight: 'rgba(139,92,246,0.5)',
      },
      {
        baseRatio: 0.8,
        speed: 0.38,
        ampRatio: 1.2,
        phase: 1.2,
        fa: 2.4,
        fb: 4.6,
        fc: 6.4,
        glowWidth: 1.5,
        darkTop: 'rgba(139,92,246,0.22)',
        darkBot: 'rgba(139,92,246,0.0)',
        lightTop: 'rgba(99,102,241,0.11)',
        lightBot: 'rgba(99,102,241,0.0)',
        glowDark: 'rgba(167,139,250,0.6)',
        glowLight: 'rgba(99,102,241,0.4)',
      },
      {
        baseRatio: 0.7,
        speed: 0.62,
        ampRatio: 0.85,
        phase: 2.5,
        fa: 3.2,
        fb: 5.8,
        fc: 6.8,
        glowWidth: 1.0,
        darkTop: 'rgba(59,130,246,0.18)',
        darkBot: 'rgba(59,130,246,0.0)',
        lightTop: 'rgba(59,130,246,0.09)',
        lightBot: 'rgba(59,130,246,0.0)',
        glowDark: 'rgba(96,165,250,0.55)',
        glowLight: 'rgba(59,130,246,0.35)',
      },
      {
        baseRatio: 0.6,
        speed: 0.29,
        ampRatio: 0.65,
        phase: 4.1,
        fa: 2.8,
        fb: 5.8,
        fc: 7.6,
        glowWidth: 1.0,
        darkTop: 'rgba(139,92,246,0.12)',
        darkBot: 'rgba(139,92,246,0.0)',
        lightTop: 'rgba(139,92,246,0.06)',
        lightBot: 'rgba(139,92,246,0.0)',
        glowDark: 'rgba(196,181,253,0.4)',
        glowLight: 'rgba(139,92,246,0.25)',
      },
    ];

    function getSize() {
      return { w: parent.offsetWidth, h: parent.offsetHeight };
    }

    function resizeCanvas() {
      const { w, h } = getSize();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function waveY(t, x, w, baseY, speed, amp, phase, fa, fb, fc) {
      const p = (x / w) * Math.PI * 2;
      const breathe = 1 + 0.08 * Math.sin(t * 0.35) + 0.02 * Math.sin(t * 0.95);
      return (
        baseY +
        amp * breathe * Math.sin(p * fa + t * speed + phase) +
        amp * 0.52 * Math.sin(p * fb + t * speed * 1.33 + phase * 1.7) +
        amp * 0.25 * Math.sin(p * fc + t * speed * 0.75 + phase * 0.9) +
        amp * 0.12 * Math.sin(p * (fa + fb) * 0.52 + t * speed * 1.8 + phase * 2.3)
      );
    }

    function drawLayer(t, w, h, cfg, isDark) {
      const baseY = h * cfg.baseRatio;
      const amp = w * 0.028 * cfg.ampRatio;

      ctx.beginPath();
      ctx.moveTo(0, h * 2);
      for (let x = 0; x <= w; x += 2) {
        ctx.lineTo(x, waveY(t, x, w, baseY, cfg.speed, amp, cfg.phase, cfg.fa, cfg.fb, cfg.fc));
      }
      ctx.lineTo(w, h * 2);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, baseY - amp, 0, h * 2);
      fillGrad.addColorStop(0, isDark ? cfg.darkTop : cfg.lightTop);
      fillGrad.addColorStop(1, isDark ? cfg.darkBot : cfg.lightBot);
      ctx.fillStyle = fillGrad;
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = waveY(t, x, w, baseY, cfg.speed, amp, cfg.phase, cfg.fa, cfg.fb, cfg.fc);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isDark ? cfg.glowDark : cfg.glowLight;
      ctx.lineWidth = cfg.glowWidth;
      ctx.shadowColor = isDark ? cfg.glowDark : cfg.glowLight;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }

    function tick() {
      const { w, h } = getSize();
      tRef.current += 0.012;
      const t = tRef.current;
      const isDark = canvas.dataset.dark === 'true';

      ctx.clearRect(0, 0, w, h);
      for (let i = LAYERS.length - 1; i >= 0; i -= 1) {
        drawLayer(t, w, h, LAYERS[i], isDark);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    resizeCanvas();
    tick();

    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.dataset.dark = darkMode ? 'true' : 'false';
    }
  }, [darkMode]);

  return <canvas ref={canvasRef} className="banner-waves-canvas" aria-hidden="true" />;
}
