'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, ThumbsUp, Heart } from 'lucide-react';

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: "@Designer_Luna",
      role: "电商设计师",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "以前修图调色要花半天，现在用你们AI几分钟搞定！尤其是换背景和智能穿搭推荐，简直是我们电商团队的救命神器——效率翻倍，创意还不受限！",
      rating: 5,
      likes: 128,
      verified: true
    },
    {
      id: 2,
      name: "@Creative_Max",
      role: "独立插画师",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "AI图片生成让我能够快速探索不同的艺术风格，从概念到成品只需要几分钟。这完全改变了我的创作流程，让我能够专注于创意而不是技术细节。",
      rating: 5,
      likes: 95,
      verified: true
    },
    {
      id: 3,
      name: "@Marketing_Sarah",
      role: "市场营销经理",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "我们团队现在可以快速生成各种营销素材，从社交媒体图片到产品宣传图，质量都很高。客户对我们的创意输出速度赞不绝口！",
      rating: 5,
      likes: 87,
      verified: true
    },
    {
      id: 4,
      name: "@GameDev_Alex",
      role: "游戏开发者",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "游戏概念图生成太棒了！以前需要花大量时间找参考图，现在直接描述想法就能得到高质量的概念图，大大加速了我们的开发流程。",
      rating: 5,
      likes: 156,
      verified: true
    },
    {
      id: 5,
      name: "@Architect_Emma",
      role: "建筑设计师",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      content: "将设计草图转化为逼真的建筑渲染图，让客户能够更直观地理解我们的设计理念。AI技术让建筑可视化变得如此简单高效。",
      rating: 5,
      likes: 112,
      verified: true
    },
    {
      id: 6,
      name: "@Content_Creator",
      role: "内容创作者",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      content: "作为内容创作者，我需要大量的视觉素材。AI图片生成让我能够快速创建符合品牌调性的图片，而且质量完全不输专业摄影师的作品。",
      rating: 5,
      likes: 203,
      verified: true
    }
  ];

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentUser = testimonials[currentTestimonial];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-black/30 to-black/50">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            用户体验
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            听听来自全球用户的真实反馈，了解AI图片生成如何改变他们的创作方式
          </p>
        </motion.div>

        {/* 主要评价展示 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-custom rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
            {/* 引用图标 */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                <Quote className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* 评价内容 */}
            <motion.div
              key={currentTestimonial}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <blockquote className="text-xl md:text-2xl text-white italic leading-relaxed mb-6">
                "{currentUser.content}"
              </blockquote>

              {/* 评分 */}
              <div className="flex justify-center space-x-1 mb-6">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`w-6 h-6 ${
                      index < currentUser.rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* 用户信息 */}
            <motion.div
              key={`user-${currentTestimonial}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-600">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 彩色边框效果 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-75 blur-sm"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-50 blur-sm"></div>
              </div>

              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
                  {currentUser.verified && (
                    <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      已验证
                    </div>
                  )}
                </div>
                <p className="text-gray-400 mb-3">{currentUser.role}</p>
                
                {/* 点赞数 */}
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{currentUser.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>Like</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="bg-white/10 backdrop-blur-custom text-white p-3 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* 指示器 */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? 'bg-blue-500 w-8'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="bg-white/10 backdrop-blur-custom text-white p-3 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* 自动播放控制 */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isAutoPlaying
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                }`}
              >
                {isAutoPlaying ? '暂停轮播' : '开始轮播'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
        >
          {[
            { label: '满意用户', value: '50,000+', icon: '👥' },
            { label: '生成图片', value: '1M+', icon: '🎨' },
            { label: '平均评分', value: '4.9/5', icon: '⭐' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-white/5 backdrop-blur-custom rounded-2xl p-6 border border-white/10"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
