'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Star, Crown, Zap, ArrowRight, Eye, Heart, Download } from 'lucide-react';

const ProModelSection = () => {
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  const proImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=400&fit=crop',
      title: '未来都市',
      description: 'Pro Model生成',
      model: 'Pro',
      likes: 1248,
      views: 5620,
      tags: ['科幻', '建筑', '未来']
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      title: '梦幻森林',
      description: 'Max Model生成',
      model: 'Max',
      likes: 2156,
      views: 8930,
      tags: ['自然', '森林', '梦幻']
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=400&fit=crop',
      title: '抽象艺术',
      description: 'Pro Model生成',
      model: 'Pro',
      likes: 892,
      views: 3450,
      tags: ['抽象', '艺术', '色彩']
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=400&fit=crop',
      title: '人物肖像',
      description: 'Max Model生成',
      model: 'Max',
      likes: 3421,
      views: 12890,
      tags: ['人物', '肖像', '写实']
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
      title: '机械战士',
      description: 'Pro Model生成',
      model: 'Pro',
      likes: 1876,
      views: 6780,
      tags: ['机械', '战士', '科幻']
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop',
      title: '宇宙探索',
      description: 'Max Model生成',
      model: 'Max',
      likes: 2934,
      views: 11200,
      tags: ['宇宙', '探索', '星空']
    }
  ];

  const getModelBadge = (model: string) => {
    if (model === 'Max') {
      return (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
          <Crown className="w-3 h-3" />
          <span>MAX</span>
        </div>
      );
    }
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
        <Zap className="w-3 h-3" />
        <span>PRO</span>
      </div>
    );
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black/50 to-black/30">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Pro/Max级别模型
            </h2>
            <Crown className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            体验最先进的AI图片生成技术，创造令人惊叹的视觉作品
          </p>
        </motion.div>

        {/* 图片展示网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {proImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredImage(image.id)}
              onMouseLeave={() => setHoveredImage(null)}
            >
              <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 backdrop-blur-custom border border-white/10">
                {/* 图片 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* 渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* 模型标签 */}
                  <div className="absolute top-4 left-4">
                    {getModelBadge(image.model)}
                  </div>

                  {/* 悬停时的操作按钮 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: hoveredImage === image.id ? 1 : 0,
                      y: hoveredImage === image.id ? 0 : 20
                    }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center space-x-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white/20 backdrop-blur-custom text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white/20 backdrop-blur-custom text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-white/20 backdrop-blur-custom text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* 图片信息 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{image.title}</h3>
                      <p className="text-gray-400 text-sm">{image.description}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {image.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="bg-white/10 text-white px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{image.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{image.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 底部CTA区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-custom rounded-3xl p-8 md:p-12 border border-white/10">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              想要更多了解？
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              加入我们的社区，与其他创作者分享经验，获取最新AI技术资讯
            </p>
            
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)' 
              }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
            >
              <span>进入社区</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProModelSection;
