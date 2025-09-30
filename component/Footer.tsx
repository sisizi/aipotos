'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Heart,
  Star
} from 'lucide-react';

const Footer = () => {
  const t = useTranslations('footer');

  const footerLinks = {
    product: {
      titleKey: 'product.title',
      links: [
        { nameKey: 'product.aiGeneration', href: '#' },
        { nameKey: 'product.batch', href: '#' },
        { nameKey: 'product.api', href: '#' },
        { nameKey: 'product.pricing', href: '#' },
        { nameKey: 'product.enterprise', href: '#' }
      ]
    },
    support: {
      titleKey: 'support.title',
      links: [
        { nameKey: 'support.help', href: '#' },
        { nameKey: 'support.docs', href: '#' },
        { nameKey: 'support.community', href: '#' },
        { nameKey: 'support.contact', href: '#' },
        { nameKey: 'support.status', href: '#' }
      ]
    },
    community: {
      titleKey: 'communitySection.title',
      links: [
        { nameKey: 'communitySection.gallery', href: '#' },
        { nameKey: 'communitySection.challenges', href: '#' },
        { nameKey: 'communitySection.developers', href: '#' },
        { nameKey: 'communitySection.partners', href: '#' },
        { nameKey: 'communitySection.news', href: '#' }
      ]
    },
    legal: {
      titleKey: 'legal.title',
      links: [
        { nameKey: 'legal.privacy', href: '#' },
        { nameKey: 'legal.terms', href: '#' },
        { nameKey: 'legal.copyright', href: '#' },
        { nameKey: 'legal.cookies', href: '#' },
        { nameKey: 'legal.gdpr', href: '#' }
      ]
    }
  };

  const socialLinks = [
    { name: 'Twitter', icon: <Twitter className="w-5 h-5" />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, href: '#' },
    { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, href: '#' }
  ];

  return (
    <footer className="bg-gradient-to-b from-black/50 to-black/90 backdrop-blur-custom">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* 品牌信息 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <span className="text-2xl font-bold text-white">{t('brandName')}</span>
            </div>

            <p className="text-gray-400 text-lg leading-relaxed mb-6 max-w-md">
              {t('tagline')}
            </p>

            {/* 联系信息 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5" />
                <span>{t('contact.email')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5" />
                <span>{t('contact.phone')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>{t('contact.address')}</span>
              </div>
            </div>

            {/* 社交媒体 */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-custom text-gray-400 hover:text-white p-3 rounded-xl hover:bg-white/20 transition-all duration-200 cursor-pointer"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* 链接列 */}
          {Object.entries(footerLinks).map(([key, section], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-white font-bold text-lg mb-6">{t(section.titleKey)}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <motion.a
                      href={link.href}
                      whileHover={{ x: 5 }}
                      className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group cursor-pointer"
                    >
                      <span>{t(link.nameKey)}</span>
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* 订阅区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-custom rounded-2xl p-8 mb-12 border border-white/10"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t('subscribe.title')}
            </h3>
            <p className="text-gray-300 text-lg mb-6">
              {t('subscribe.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('subscribe.placeholder')}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-custom text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{t('subscribe.button')}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 分割线 */}
        <div className="border-t border-white/10 mb-8"></div>

        {/* 底部信息 */}
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-gray-400 text-center md:text-left"
          >
            <p className="flex items-center space-x-2">
              <span>{t('copyright')}</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">{t('madeWith')}</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span className="hidden md:inline">{t('madeIn')}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center space-x-6"
          >
            <div className="flex items-center space-x-2 text-gray-400">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>4.9/5 {t('userRating')}</span>
            </div>
            <div className="text-gray-400">
              <span>50,000+ {t('satisfiedUsers')}</span>
            </div>
          </motion.div>
        </div>

        {/* 装饰性元素 */}
        {/* <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div> */}
      </div>
    </footer>
  );
};

export default Footer;
