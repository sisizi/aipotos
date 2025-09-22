'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

/**
 * AuthError 组件 - 用于显示登录错误信息的页面
 * 该组件会根据不同的错误类型显示相应的错误提示，并提供解决方案和重试选项
 */
function AuthErrorContent() {
  // 从URL参数中获取错误信息
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  /**
   * 根据错误类型返回对应的错误信息
   * @param error - 错误类型字符串
   * @returns 对应的错误信息描述
   */
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthSignin':
        return 'OAuth 登录失败。可能是网络连接问题或配置错误。'
      case 'OAuthCallback':
        return 'OAuth 回调失败。请检查重定向URI配置。'
      case 'OAuthCreateAccount':
        return '创建账户失败。'
      case 'EmailCreateAccount':
        return '邮箱账户创建失败。'
      case 'Callback':
        return '回调处理失败。'
      case 'OAuthAccountNotLinked':
        return '此邮箱已经关联到其他账户。'
      case 'EmailSignin':
        return '邮箱登录失败。'
      case 'CredentialsSignin':
        return '凭据登录失败。请检查用户名和密码。'
      case 'SessionRequired':
        return '需要登录才能访问此页面。'
      default:
        return '登录过程中发生未知错误。'
    }
  }

  return (
    // 主容器 - 设置全屏高度和居中显示
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 内容容器 - 设置最大宽度和响应式边距 */}
      <div className="max-w-md w-full space-y-8">
        {/* 错误信息展示区域 */}
        <div className="text-center">
          {/* 错误标题 */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登录失败
          </h2>
          {/* 错误详情框 - 红色边框和背景 */}
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              {/* 错误图标 */}
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              {/* 错误详情文本 */}
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  错误详情
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{getErrorMessage(error)}</p>
                  {/* 显示具体的错误代码 */}
                  {error && (
                    <p className="mt-1 text-xs text-red-600">
                      错误代码: {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 可能的问题原因列表 */}
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              如果问题持续存在，可能的原因：
            </p>
            <ul className="text-xs text-gray-500 text-left space-y-1">
              <li>• 网络连接问题（无法访问Google服务）</li>
              <li>• Google OAuth配置错误</li>
              <li>• 重定向URI配置不正确</li>
              <li>• Google Cloud Console API未启用</li>
            </ul>
          </div>

          {/* 操作按钮区域 */}
          <div className="mt-6 space-y-3">
            {/* 重新登录按钮 */}
            <Link
              href="/api/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              重新尝试登录
            </Link>
            {/* 返回首页按钮 */}
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Loading...</div></div>}>
      <AuthErrorContent />
    </Suspense>
  )
}