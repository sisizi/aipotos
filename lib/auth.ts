import { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { supabaseAdmin } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000, // 10秒超时
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000, // 10秒超时
      },
    })
  ],
  // 临时注释掉数据库适配器来测试OAuth是否工作
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // }),
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
      }
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token, user }) {
      if (session.user) {
        // 使用JWT策略时，user参数不可用，使用token.sub
        session.user.id = token.sub as string
      }
      session.accessToken = token.accessToken
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account, profile })
      
      // 临时简化，直接返回true允许登录
      if (user && user.email) {
        try {
          const { data: existingUser, error } = await supabaseAdmin
            .from('users')
            .select('id, email, credits, user_level')
            .eq('email', user.email)
            .single()

          if (!existingUser && !error) {
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                name: user.name || '',
                avatar_url: user.image || '',
                credits: 100,
                user_level: 'free',
                provider: account?.provider || 'unknown'
              })

            if (insertError) {
              console.error('Error creating user:', insertError)
              // 不阻止登录，只记录错误
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          // 不阻止登录，只记录错误
        }
      }
      return true
    }
  },
  // 移除自定义页面，使用默认的Next-Auth页面
  // pages: {
  //   signIn: '/auth/signin',
  //   error: '/auth/error',
  // },
  session: {
    strategy: 'jwt', // 改为JWT策略来避免数据库适配器问题
  },
  debug: process.env.NODE_ENV === 'development', // 开启调试模式
}