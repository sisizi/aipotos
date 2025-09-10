'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  Shield, 
  Cloud, 
  Database, 
  Layers,
  ArrowRight,
  Terminal,
  Code
} from 'lucide-react';

const TechSupportSection = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const terminalLines = [
    '$ ai-photo generate --prompt "futuristic city" --model pro',
    '✓ Initializing AI model...',
    '✓ Loading neural networks...',
    '✓ Processing prompt...',
    '✓ Generating image...',
    '✓ Enhancing details...',
    '✓ Applying style transfer...',
    '✓ Finalizing output...',
    '✓ Image generated successfully!',
    '📁 Saved to: /outputs/futuristic_city_pro.png',
    '⏱️  Generation time: 2.3s',
    '🎨 Quality score: 9.8/10',
    '',
    '$ ai-photo batch --input prompts.txt --model max --count 10',
    '✓ Processing batch generation...',
    '✓ Generated 10 high-quality images',
    '📊 Average generation time: 1.8s per image',
    '💾 Total size: 45.2 MB',
    '',
    '$ ai-photo optimize --input image.jpg --enhance --upscale 2x',
    '✓ Analyzing image...',
    '✓ Applying AI enhancement...',
    '✓ Upscaling to 4K resolution...',
    '✓ Optimizing for web delivery...',
    '✓ Process completed successfully!',
    '',
    '🚀 Ready for next command...'
  ];

  const techFeatures = [
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Advanced AI Models",
      description: "Based on the latest deep learning technology, supporting multiple generation modes",
      features: ["GPT-4 Vision", "DALL-E 3", "Stable Diffusion XL", "Midjourney V6"]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast Generation",
      description: "Optimized algorithm architecture ensuring fast response and high-quality output",
      features: ["2-5s Generation", "Batch Processing", "Real-time Preview", "Smart Caching"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security protection for your data and privacy",
      features: ["End-to-End Encryption", "Data Isolation", "Privacy Protection", "Compliance Certification"]
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Cloud Processing",
      description: "Powerful cloud computing capabilities without local hardware requirements",
      features: ["Elastic Scaling", "Global CDN", "99.9% Uptime", "Auto Backup"]
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Smart Storage",
      description: "Intelligent file management and version control",
      features: ["Version History", "Smart Classification", "Fast Search", "Cloud Sync"]
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "API Integration",
      description: "Rich API interfaces for easy integration into your applications",
      features: ["RESTful API", "Webhook Support", "SDK Support", "Complete Documentation"]
    }
  ];

  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev >= terminalLines.length - 1) {
            setIsTyping(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isTyping, terminalLines.length]);

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
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Terminal className="w-8 h-8 text-green-500" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Technical Support / AI Model Support
            </h2>
            <Terminal className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Based on the most advanced artificial intelligence technology, providing powerful technical support for your creativity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* 终端演示区域 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
              {/* 终端头部 */}
              <div className="bg-gray-800 px-6 py-4 flex items-center space-x-2 border-b border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm font-mono">ai-photo-cli</span>
                </div>
              </div>

              {/* 终端内容 */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-1">
                  {terminalLines.slice(0, currentLine + 1).map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                      className={`${
                        line.startsWith('$') 
                          ? 'text-green-400' 
                          : line.startsWith('✓') 
                          ? 'text-green-500' 
                          : line.startsWith('📁') || line.startsWith('⏱️') || line.startsWith('🎨') || line.startsWith('📊') || line.startsWith('💾')
                          ? 'text-blue-400'
                          : line.startsWith('🚀')
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {line}
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-green-400"
                    >
                      █
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
          </motion.div>

          {/* 技术特性区域 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center lg:text-left">
              <h3 className="text-3xl font-bold text-white mb-4">
                Powerful Technical Architecture
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Based on the most advanced AI technology stack, providing professional-grade technical support for your creativity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="bg-gray-900/50 backdrop-blur-custom rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-1">{feature.title}</h4>
                      <p className="text-gray-300">{feature.description}</p>
                      <button className="mt-2 text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1">
                        <span>View Docs</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center space-x-2 mx-auto lg:mx-0"
              >
                <Code className="w-5 h-5" />
                <span>View Technical Documentation</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TechSupportSection;
