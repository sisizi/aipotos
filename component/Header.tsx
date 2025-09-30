"use client";

import { useState, useEffect } from "react";
// Framer Motion: 提供高级动画功能
import { motion } from "framer-motion";
// Lucide React: 轻量级图标库
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
// NextAuth
import { useSession, signIn, signOut } from "next-auth/react";
// Next.js Image
import Image from "next/image";
// Next.js Link
import Link from "next/link";
// next-intl
import { useTranslations } from 'next-intl';
// Language Switcher
import LanguageSwitcher from './LanguageSwitcher';


/**
 * Header组件 - 网站顶部导航栏组件
 * 包含响应式设计、滚动效果、动画交互等功能
 */
const Header = () => {
  // 状态管理：跟踪页面滚动状态和移动端菜单展开状态
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // NextAuth session
  const { data: session, status } = useSession();

  // Translations
  const t = useTranslations('nav');

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
  const navItems = [
    { key: 'create', label: t('create'), href: '/edit-image' },
    { key: 'myCreations', label: t('myCreations'), href: '#' },
    { key: 'pricing', label: t('pricing'), href: '#' }
  ];

  return (


    <motion.header
      // 初始状态和动画设置
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      // 根据滚动状态动态改变样式
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled
          ? " backdrop-blur-md shadow-sm"
          : "bg-transparent backdrop-blur-custom"
      }`}
    >

      {/* 导航栏内容容器 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 border-b border-white/10">
        {/* 导航栏主体布局 */}
        <div className="flex items-center justify-between space-x-4 sm:space-x-12">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }} // 鼠标悬停时轻微放大
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="text-white text-xl sm:text-2xl font-bold">AI Art Studio</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.key}
                href={item.href}
                className="text-white hover:text-blue-300 transition-colors duration-200 relative group text-xl cursor-pointer"
                whileHover={{ y: -2 }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </motion.a>

            ))}
          </nav>

          {/* 右边部分 */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* 语言选择 */}
            <LanguageSwitcher />

            {/* 用户认证区域 */}
            {status === "loading" ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            ) : session ? (
              <motion.div whileHover={{ scale: 1.05 }} className="relative group">
                <button className="flex items-center space-x-2 text-white hover:text-blue-300 transition-colors text-xl cursor-pointer">
                  {session.user?.image ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User avatar"}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="max-w-[100px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                </button>

                <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-custom rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="py-2">
                    <div className="px-4 py-2 text-gray-300 border-b border-gray-700">
                      <p className="text-sm">{session.user?.name}</p>
                      <p className="text-xs text-gray-400">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signIn('google')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </motion.button>
            )}
          </div>

          {/* Mobile: Language + User Avatar + Menu Button */}
          <div className="flex lg:hidden items-center space-x-3">
            {/* 移动端语言选择 */}
            <LanguageSwitcher />

            {/* 移动端用户头像 */}
            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <LogIn className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="text-white cursor-pointer hover:text-blue-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            height: isMobileMenuOpen ? "auto" : 0,
          }}
          className="lg:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            {/* 导航菜单项 */}
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="block text-white hover:text-blue-300 transition-colors cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}

            {/* 移动端用户认证区域 - 仅显示登出按钮 */}
            {session && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full text-left text-white hover:text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
