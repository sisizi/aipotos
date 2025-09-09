'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const VideoSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // AI生成的示例图片数据
  const aiImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
      title: '科幻城市',
      description: '未来主义建筑群',
      model: 'Pro Model'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      title: '自然风景',
      description: '山峦与湖泊',
      model: 'Max Model'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
      title: '抽象艺术',
      description: '色彩斑斓的抽象画',
      model: 'Pro Model'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
      title: '人物肖像',
      description: 'AI生成的人物形象',
      model: 'Max Model'
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % aiImages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, aiImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % aiImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + aiImages.length) % aiImages.length);
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          {/* 视频区域 */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* 视频容器 */}
              <div className="relative aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-custom">
                <iframe
                  src="https://www.byteplus.com/en/product/Seedream?utm_source=google&utm_medium=cpa&utm_campaign=22850247342&utm_content=191826389988&utm_term=text%20to%20image%20ai&gad_source=1&gad_campaignid=22850247342&gbraid=0AAAAA9g5XBS_5qQydy2sg5Pn-n1LlxEct&gclid=CjwKCAjw_fnFBhB0EiwAH_MfZjB55H31PbBV-BhfVIB7SCELzgx5ciOWtIHSYfpv1va3Otfb-4ZNfxoCPpsQAvD_BwE"
                  className="w-full h-full rounded-2xl"
                  allowFullScreen
                  title="AI图片生成演示"
                />
                
                {/* 播放控制覆盖层 */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-white/20 backdrop-blur-custom text-white p-4 rounded-full hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </motion.button>
                </div>
              </div>

              {/* 装饰性边框 */}
              {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 blur-sm"></div> */}
            </motion.div>
          </div>

          {/* AI图片轮播区域 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                探索AI生成的
                <span className="gradient-text"> 无限可能</span>
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                从概念到现实，只需几秒钟。我们的AI模型能够理解您的创意描述，
                生成高质量、独特的图像作品。
              </p>
            </motion.div>

            {/* 图片轮播 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative h-80 rounded-2xl overflow-hidden">
                {aiImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: index === currentImageIndex ? 1 : 0,
                      scale: index === currentImageIndex ? 1 : 0.8,
                      zIndex: index === currentImageIndex ? 10 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div className="relative h-full group">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* 图片信息覆盖层 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-white font-semibold text-lg">{image.title}</h3>
                              <p className="text-gray-300 text-sm">{image.description}</p>
                            </div>
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              {image.model}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 轮播控制按钮 */}
              <div className="flex items-center justify-center space-x-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevImage}
                  className="bg-white/10 backdrop-blur-custom text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                {/* 指示器 */}
                <div className="flex space-x-2">
                  {aiImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-blue-500 w-8'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextImage}
                  className="bg-white/10 backdrop-blur-custom text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* 自动播放控制 */}
              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="text-sm">
                    {isPlaying ? '暂停轮播' : '开始轮播'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
