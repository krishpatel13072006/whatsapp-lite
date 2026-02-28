import React, { useRef, useCallback, useEffect, useState } from 'react';

const KineticGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>();
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cols = 30;
    const rows = 20;
    const cellW = w / cols;
    const cellH = h / rows;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const x = i * cellW;
        const y = j * cellH;
        const dx = mx - x;
        const dy = my - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 250;
        const influence = Math.max(0, 1 - dist / maxDist);
        const offsetX = dx * influence * 0.08;
        const offsetY = dy * influence * 0.08;

        const nx = x + offsetX;
        const ny = y + offsetY;

        // Draw dot
        const dotSize = 1 + influence * 2;
        const alpha = 0.1 + influence * 0.4;
        ctx.beginPath();
        ctx.arc(nx, ny, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 168, 132, ${alpha})`;
        ctx.fill();

        // Draw horizontal line
        if (i < cols) {
          const nx2 = (i + 1) * cellW;
          const dx2 = mx - nx2;
          const dy2 = my - y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          const inf2 = Math.max(0, 1 - dist2 / maxDist);
          const ox2 = dx2 * inf2 * 0.08;
          const oy2 = dy2 * inf2 * 0.08;

          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx2 + ox2, y + oy2);
          ctx.strokeStyle = `rgba(0, 168, 132, ${0.05 + influence * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        // Draw vertical line
        if (j < rows) {
          const ny2 = (j + 1) * cellH;
          const dx2 = mx - x;
          const dy2 = my - ny2;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          const inf2 = Math.max(0, 1 - dist2 / maxDist);
          const ox2 = dx2 * inf2 * 0.08;
          const oy2 = dy2 * inf2 * 0.08;

          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(x + ox2, ny2 + oy2);
          ctx.strokeStyle = `rgba(0, 168, 132, ${0.05 + influence * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        setDims({ w: rect.width, h: rect.height });
      }
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouse);
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-auto" />;
};

export default KineticGrid;
