'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const MouseParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  // 粒子颜色配置
  const colors = [
    '#60A5FA', // blue-400
    '#A78BFA', // violet-400
    '#34D399', // emerald-400
    '#F472B6', // pink-400
    '#FBBF24', // amber-400
    '#FB7185', // rose-400
  ];

  const createParticle = (x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: Math.random() * 60 + 30, // 30-90 frames
      size: Math.random() * 3 + 1, // 1-4px
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  };

  const updateParticles = () => {
    particlesRef.current = particlesRef.current.filter(particle => {
      // 更新粒子位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life++;

      // 添加重力效果
      particle.vy += 0.05;

      // 添加阻力
      particle.vx *= 0.98;
      particle.vy *= 0.98;

      // 移除超过生命周期的粒子
      return particle.life < particle.maxLife;
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    particlesRef.current.forEach(particle => {
      const opacity = 1 - (particle.life / particle.maxLife);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateParticles();
    drawParticles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // 随机生成粒子（不是每次移动都生成）
      if (Math.random() < 0.3) {
        particlesRef.current.push(
          createParticle(e.clientX, e.clientY)
        );
      }

      // 限制粒子数量
      if (particlesRef.current.length > 50) {
        particlesRef.current = particlesRef.current.slice(-50);
      }
    };

    // 鼠标点击事件 - 生成更多粒子
    const handleMouseClick = (e: MouseEvent) => {
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push(
          createParticle(e.clientX, e.clientY)
        );
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);

    // 开始动画
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 pointer-events-none z-50"
      style={{
        mixBlendMode: 'screen', // 混合模式让粒子更亮
      }}
    />
  );
};

export default MouseParticles;