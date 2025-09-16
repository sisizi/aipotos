'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, ThumbsUp, Heart } from 'lucide-react';
import Image from 'next/image';

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: "@Designer_Luna",
      role: "E-commerce Designer",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "Photo editing and color correction used to take half a day, now with your AI it's done in minutes! Especially background replacement and smart outfit recommendations - it's a lifesaver for our e-commerce team. Efficiency doubled, creativity unlimited!",
      rating: 5,
      likes: 128,
      verified: true
    },
    {
      id: 2,
      name: "@Creative_Max",
      role: "Independent Illustrator",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "AI image generation allows me to quickly explore different artistic styles, from concept to finished product in just minutes. This completely changed my creative workflow, letting me focus on creativity rather than technical details.",
      rating: 5,
      likes: 95,
      verified: true
    },
    {
      id: 3,
      name: "@Marketing_Sarah",
      role: "Marketing Manager",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "Our team can now quickly generate various marketing materials, from social media images to product promotional graphics, all with high quality. Clients are amazed by our creative output speed!",
      rating: 5,
      likes: 87,
      verified: true
    },
    {
      id: 4,
      name: "@GameDev_Alex",
      role: "Game Developer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "Game concept art generation is amazing! Previously we spent a lot of time finding reference images, now we can directly describe ideas and get high-quality concept art, greatly accelerating our development process.",
      rating: 5,
      likes: 156,
      verified: true
    },
    {
      id: 5,
      name: "@Architect_Emma",
      role: "Architectural Designer",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      content: "Converting design sketches into realistic architectural renderings helps clients understand our design concepts more intuitively. AI technology makes architectural visualization so simple and efficient.",
      rating: 5,
      likes: 112,
      verified: true
    },
    {
      id: 6,
      name: "@Content_Creator",
      role: "Content Creator",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      content: "As a content creator, I need lots of visual materials. AI image generation allows me to quickly create images that match brand tone, and the quality is no less than professional photographer works.",
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
            User Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Listen to real feedback from users worldwide and learn how AI image generation is changing their creative process
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
              <blockquote className="text-xl md:text-2xl text-white leading-relaxed mb-6">
                {currentUser.content}
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
                  {/* <Image
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  /> */}
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
                      Verified
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
                {isAutoPlaying ? 'Pause Slideshow' : 'Start Slideshow'}
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
            { label: 'Satisfied Users', value: '50,000+', icon: '👥' },
            { label: 'Generated Images', value: '1M+', icon: '🎨' },
            { label: 'Average Rating', value: '4.9/5', icon: '⭐' }
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
