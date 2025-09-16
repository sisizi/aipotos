"use client";

import { useState, useEffect } from "react";
// Framer Motion: 提供高级动画功能
import { motion } from "framer-motion";
// Lucide React: 轻量级图标库
import { Menu, X, Globe } from "lucide-react";
import LoginButton from "./auth/login-button";


/**
 * Header组件 - 网站顶部导航栏组件
 * 包含响应式设计、滚动效果、动画交互等功能
 */
const Header = () => {
  // 状态管理：跟踪页面滚动状态和移动端菜单展开状态
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 使用useEffect添加滚动事件监听器
  useEffect(() => {
    // 处理滚动事件的函数,监听页面滚动，超过50px时改变导航栏样式
    const handleScroll = () => {
      // 检查是否有弹窗打开，如果有则不改变导航栏样式
      const hasModal = document.querySelector('[data-modal="login-modal"]');
      if (hasModal) return;
      
      setIsScrolled(window.scrollY > 70);
    };

    // 添加滚动事件监听
    window.addEventListener("scroll", handleScroll);
    // 组件卸载时移除事件监听，避免内存泄漏
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // 导航菜单项数组
  const navItems = ["Product", "Pricing", "Docs"];

  return (


    <motion.header
      // 初始状态和动画设置
      initial={{ y: -100 }}
      animate={{ y: 20 }}
      // 根据滚动状态动态改变样式
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled
          ? " backdrop-blur-md shadow-sm"
          : "bg-transparent backdrop-blur-custom"
      }`}
    >

      {/* 导航栏内容容器 */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* 导航栏主体布局 */}
        <div className="flex items-center justify-between space-x-12">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }} // 鼠标悬停时轻微放大
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white text-2xl font-bold">AI Art Studio</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-12">
            {navItems.map((item) => (
              <motion.a
                key={item}
                href="#"
                className="text-white hover:text-blue-300 transition-colors duration-200 relative group text-xl"
                whileHover={{ y: -2 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </motion.a>

            ))}
          </nav>

          {/* 右边部分 */}
          <div className="hidden md:flex items-center space-x-8">
            {/* 语言选择 */}
            <motion.div whileHover={{ scale: 1.05 }} className="relative group">

              <button className="flex items-center space-x-1 text-white hover:text-blue-300 transition-colors text-xl">
                <Globe className="w-4 h-4" />
                <span>EN</span>
              </button>
{/* 一个隐藏在父元素下方、右对齐的下拉菜单容器，平时不可见，当用户悬停在父元素上时，会以淡入方式平滑显示出来。 */}
              <div className="absolute top-full right-0 mt-2 w-32 bg-black/90 backdrop-blur-custom rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               
                <div className="py-2">
                  <a
                    href="#"
                    className="block px-4 py-2 text-white hover:bg-white/10"
                  >
                    中文
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-white hover:bg-white/10"
                  >
                    日本語
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-white hover:bg-white/10"
                  >
                    한국어
                  </a>
                </div>
              </div>
            </motion.div>

            {/* 登录按钮*/}
            <LoginButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            height: isMobileMenuOpen ? "auto" : 0,
          }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="block text-white hover:text-blue-300 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-4 border-t border-white/20">
              <LoginButton />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
