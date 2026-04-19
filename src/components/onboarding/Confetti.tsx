"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#7c3aed", "#6366f1", "#10b981", "#f59e0b", "#f472b6", "#38bdf8", "#a78bfa"];

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x:             Math.random() * canvas.width,
      y:             -20 - Math.random() * 200,
      vx:            (Math.random() - 0.5) * 3,
      vy:            Math.random() * 3 + 1.5,
      color:         COLORS[Math.floor(Math.random() * COLORS.length)],
      w:             Math.random() * 10 + 4,
      h:             Math.random() * 5  + 3,
      rotation:      Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity:       1,
    }));

    const startTime = Date.now();
    let frame: number;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const elapsed = (Date.now() - startTime) / 1000;

      for (const p of particles) {
        p.x        += p.vx;
        p.y        += p.vy;
        p.vy       += 0.04; // gravity
        p.rotation += p.rotationSpeed;
        if (elapsed > 2.5) p.opacity = Math.max(0, 1 - (elapsed - 2.5) / 1.5);

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }

      if (elapsed < 4.5) frame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}
