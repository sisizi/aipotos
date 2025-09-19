'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        // 恢复背景滚动
        document.body.style.overflow = 'unset'
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  /**
   * 处理用户登录函数
   * @param provider - 登录提供商，目前支持'google'
   */
  const handleLogin = async (provider: 'google') => {
    // 设置当前正在加载的登录提供商
    setIsLoading(provider)
    // 在控制台输出尝试登录的信息
    console.log(`Attempting login with ${provider}`)
    
    try {
      // 使用默认的redirect行为，让Next-Auth处理重定向
      // callbackUrl设置为当前网站域名，确保登录后返回到首页
      await signIn(provider, {
        callbackUrl: window.location.origin
      })
      
      // 如果到这里，说明登录过程已经开始
      console.log('Login process initiated')
      onClose()
      
    } catch (error) {
      console.error('Login exception:', error)
      alert(`登录异常: ${error}`)
      setIsLoading(null)
    }
    // 不在这里重置loading状态，因为页面会重定向
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <div 
      data-modal="login-modal"
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '25vh'
      }}
    >
      {/* 背景遮罩 - 添加模糊效果 */}
      <div 
        className={`absolute  ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* 弹窗内容 */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          zIndex: 10000,
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto'
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 弹窗头部 */}
        <div className="px-6 sm:px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">登录账户</h2>
          <p className="text-gray-600">选择您喜欢的登录方式</p>
        </div>

        {/* 登录选项 */}
        <div className="px-6 sm:px-8 pb-8 space-y-3">
          {/* Google 登录 */}
          <button
            onClick={() => handleLogin('google')}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="font-medium">
              {isLoading === 'google' ? '连接中...' : '使用 Google 登录'}
            </span>
          </button>
        </div>

        {/* 底部说明 */}
        <div className="px-6 sm:px-8 pb-6">
          <p className="text-xs text-gray-500 text-center">
            登录即表示您同意我们的
            <a href="/terms" className="text-blue-600 hover:underline">服务条款</a>
            和
            <a href="/privacy" className="text-blue-600 hover:underline">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  )
}