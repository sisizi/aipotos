'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const HeroBanner = () => {
  const t = useTranslations('hero');

  const featureItems = [
    { id: 'free', label: 'Free', bg: 'bg-gradient-to-br from-sky-400 to-blue-600', content: '⌘' },
    { id: 'pro', label: 'Pro', bg: 'bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600', content: '▁' },
    { id: 'max', label: 'Max', bg: 'bg-gradient-to-br from-indigo-400 to-violet-500', content: '›_' },
  ];

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="relative pt-32 pb-8 px-6">
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-4xl font-extrabold text-white mb-0"
        >
          <span className="gradient-text">{t('title')}</span>
        </motion.h1>

        {/* CTA Card with Icons */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center"
        >
          <div className="group flex items-center gap-6 px-8 py-5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-sm">
            <span className="text-white/90 text-xl font-semibold">{t('cta')}</span>
            <span className="h-8 w-px bg-white/15" />
            <div className="flex items-center gap-4">
              {featureItems.map(item => {
                const isSelected = selected === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : item.id)}
                    className="relative group/icon focus:outline-none cursor-pointer"
                    aria-pressed={isSelected}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <div className={`rounded-[10px] p-0.5 bg-transparent transition-colors`}>
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${item.bg}`}>
                        {item.content}
                      </div>
                    </div>
                    <div className="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 rounded-[4px] transition-all">
                      {isSelected && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-xs text-white bg-black/70 opacity-0 group-hover/icon:opacity-100 transition-opacity">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div> */}
      </div>
    </section>
  );
};

export default HeroBanner;