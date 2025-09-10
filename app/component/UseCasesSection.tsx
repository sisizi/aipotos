'use client';

import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Edit3, 
  User, 
  Palette, 
  ShoppingBag, 
  Camera, 
  Building, 
  Gamepad2, 
  GraduationCap, 
  Gift, 
  Shirt, 
  Video,
  Briefcase
} from 'lucide-react';

const UseCasesSection = () => {
  const useCases = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Novel to Comic Generation",
      description: "Transform text stories into visual comics, bringing imagination to life",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-900/20 to-cyan-900/20",
      borderColor: "border-blue-500/30"
    },
    {
      icon: <Edit3 className="w-8 h-8" />,
      title: "Business Photo Editing",
      description: "Smart editing tools for quick commercial image processing",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-900/20 to-emerald-900/20",
      borderColor: "border-green-500/30"
    },
    {
      icon: <User className="w-8 h-8" />,
      title: "Personal Photo Enhancement",
      description: "Background replacement, makeup changes, outfit styling for perfect personal image",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-900/20 to-pink-900/20",
      borderColor: "border-purple-500/30"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Copy to Poster Generation",
      description: "Input event copy and automatically generate eye-catching poster designs",
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-900/20 to-red-900/20",
      borderColor: "border-orange-500/30"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "E-commerce Product Optimization",
      description: "Auto lighting, background removal, detail enhancement to boost product appeal",
      color: "from-indigo-500 to-purple-500",
      bgColor: "from-indigo-900/20 to-purple-900/20",
      borderColor: "border-indigo-500/30"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Social Media Avatar/Background Customization",
      description: "One-click generation of personalized avatars and cover images showcasing unique style",
      color: "from-teal-500 to-cyan-500",
      bgColor: "from-teal-900/20 to-cyan-900/20",
      borderColor: "border-teal-500/30"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Architectural Design Visualization",
      description: "Convert sketches or descriptions into realistic architectural renderings",
      color: "from-gray-500 to-slate-500",
      bgColor: "from-gray-900/20 to-slate-900/20",
      borderColor: "border-gray-500/30"
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Game Character/Scene Concept Art",
      description: "Quickly produce game art assets to accelerate development workflow",
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-900/20 to-orange-900/20",
      borderColor: "border-yellow-500/30"
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Educational Content Illustration",
      description: "Intelligent image generation based on teaching content to make courses more engaging",
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-900/20 to-green-900/20",
      borderColor: "border-emerald-500/30"
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Holiday Card/Invitation Design",
      description: "Input themes to automatically generate beautiful holiday visual materials",
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-900/20 to-rose-900/20",
      borderColor: "border-pink-500/30"
    },
    {
      icon: <Shirt className="w-8 h-8" />,
      title: "Fashion Design Visualization",
      description: "Generate fashion design sketches based on style descriptions",
      color: "from-violet-500 to-purple-500",
      bgColor: "from-violet-900/20 to-purple-900/20",
      borderColor: "border-violet-500/30"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Short Video Thumbnail Generation",
      description: "Smart thumbnail design to boost video click-through rates",
      color: "from-cyan-500 to-blue-500",
      bgColor: "from-cyan-900/20 to-blue-900/20",
      borderColor: "border-cyan-500/30"
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Corporate Brand Visual Generation",
      description: "Automatically generate multi-size image assets that match brand tone",
      color: "from-slate-500 to-gray-500",
      bgColor: "from-slate-900/20 to-gray-900/20",
      borderColor: "border-slate-500/30"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Use Case Inspiration
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From concept to reality, AI image generation technology provides unlimited possibilities for all industries
          </p>
        </motion.div>

        {/* 使用场景网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={`relative group cursor-pointer`}
            >
              <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${useCase.bgColor} backdrop-blur-custom border ${useCase.borderColor} hover:border-opacity-60 transition-all duration-300 h-full`}>
                {/* 背景装饰 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${useCase.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* 内容 */}
                <div className="relative z-10">
                  {/* 图标 */}
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${useCase.color} flex items-center justify-center text-white mb-4 group-hover:shadow-lg transition-all duration-300`}
                  >
                    {useCase.icon}
                  </motion.div>

                  {/* 标题和描述 */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-opacity-90 transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                    {useCase.description}
                  </p>
                </div>

                {/* 悬停效果 */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* 边框光效 */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${useCase.color} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300`}></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 底部CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Start Exploring More Possibilities
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
