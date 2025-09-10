'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const HeroSection = () => {
  const [, setCurrentText] = useState(0);
  
  const texts = [
    "Generate instantly,",
    "Imagine infinitely."
  ];

  // 新增：三枚图标的数据定义
  const featureItems = [
    { id: 'free', label: 'Free', bg: 'bg-gradient-to-br from-sky-400 to-blue-600', content: '⌘' },
    { id: 'pro', label: 'Pro', bg: 'bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600', content: '▁' },
    { id: 'max', label: 'Max', bg: 'bg-gradient-to-br from-indigo-400 to-violet-500', content: '›_' },
  ];

  // 选中状态（单选）
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* 顶部主标题：AI图像生成（大字体），容器透明无边框 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-6"
        >
          <span className="gradient-text">AI Image Generation</span>
        </motion.h1>

        {/* 一句话简介（小字体，文字从左到右闪动），容器透明且无边框 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl font-extrabold text-white mb-6 "
        >
          Generate high-quality images with AI in one click, unleash your creativity, and bring every inspiration to life.
        </motion.p>

        {/* CTA 卡片：Install now + 三图标 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center"
        >
          <div className="group flex items-center gap-6 px-8 py-5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-sm hover:border-amber-200/70 hover:bg-white/10 transition-colors duration-300">
            <span className="text-white/90 text-xl font-semibold">Get Started</span>
            <span className="h-8 w-px bg-white/15" />
            <div className="flex items-center gap-4">
              {featureItems.map(item => {
                const isSelected = selected === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : item.id)}
                    className="relative group/icon focus:outline-none"
                    aria-pressed={isSelected}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {/* 外环高亮 */}
                    <div className={`rounded-[10px] p-0.5 bg-transparent transition-colors`}>
                      {/* 图标卡片 */}
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${item.bg}`}>{item.content}</div>
                    </div>
                    {/* 勾选角标 */}
                    <div className="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 rounded-[4px] transition-all">
                      {isSelected && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    {/* 悬停提示 */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-xs text-white bg-black/70 opacity-0 group-hover/icon:opacity-100 transition-opacity">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
