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
      title: "根据小说生成漫画",
      description: "将文字故事转化为视觉漫画，让想象跃然纸上",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-900/20 to-cyan-900/20",
      borderColor: "border-blue-500/30"
    },
    {
      icon: <Edit3 className="w-8 h-8" />,
      title: "根据业务快速修图",
      description: "智能修图工具，快速处理商业图片需求",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-900/20 to-emerald-900/20",
      borderColor: "border-green-500/30"
    },
    {
      icon: <User className="w-8 h-8" />,
      title: "个人修图使用",
      description: "换背景、换妆容、换穿搭，打造完美个人形象",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-900/20 to-pink-900/20",
      borderColor: "border-purple-500/30"
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "根据文案生成海报",
      description: "输入活动文案，自动生成吸引眼球的海报设计",
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-900/20 to-red-900/20",
      borderColor: "border-orange-500/30"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "电商产品图智能优化",
      description: "自动调光、去背景、增强细节，提升商品吸引力",
      color: "from-indigo-500 to-purple-500",
      bgColor: "from-indigo-900/20 to-purple-900/20",
      borderColor: "border-indigo-500/30"
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "社交媒体头像/背景定制",
      description: "一键生成个性头像、封面图，彰显独特风格",
      color: "from-teal-500 to-cyan-500",
      bgColor: "from-teal-900/20 to-cyan-900/20",
      borderColor: "border-teal-500/30"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "建筑设计概念可视化",
      description: "将草图或描述转为逼真建筑渲染图",
      color: "from-gray-500 to-slate-500",
      bgColor: "from-gray-900/20 to-slate-900/20",
      borderColor: "border-gray-500/30"
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "游戏角色/场景概念图生成",
      description: "快速产出游戏美术素材，加速开发流程",
      color: "from-yellow-500 to-orange-500",
      bgColor: "from-yellow-900/20 to-orange-900/20",
      borderColor: "border-yellow-500/30"
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "教育课件插图自动生成",
      description: "根据教学内容智能配图，让课件更生动",
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-900/20 to-green-900/20",
      borderColor: "border-emerald-500/30"
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "节日贺卡/邀请函设计",
      description: "输入主题，自动生成精美节日视觉素材",
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-900/20 to-rose-900/20",
      borderColor: "border-pink-500/30"
    },
    {
      icon: <Shirt className="w-8 h-8" />,
      title: "服装设计灵感可视化",
      description: "根据风格描述生成服装设计图稿",
      color: "from-violet-500 to-purple-500",
      bgColor: "from-violet-900/20 to-purple-900/20",
      borderColor: "border-violet-500/30"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "短视频封面与thumbnail生成",
      description: "提升视频点击率的智能封面设计",
      color: "from-cyan-500 to-blue-500",
      bgColor: "from-cyan-900/20 to-blue-900/20",
      borderColor: "border-cyan-500/30"
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "企业品牌视觉统一生成",
      description: "自动生成符合品牌调性的多尺寸图片素材",
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
            使用灵感提供
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            从创意到实现，AI图片生成技术为各行各业提供无限可能
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
            开始探索更多可能
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
