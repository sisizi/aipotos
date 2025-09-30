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
          className="text-3xl md:text-6xl font-extrabold text-white mb-8"
        >
          <span className="gradient-text">{t('title')}</span>
        </motion.h1>
      </div>
    </section>
  );
};

export default HeroBanner;