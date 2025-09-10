// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  // 重要：使用无前缀的环境变量
  return createServerClient(
    process.env.SUPABASE_URL!, // 不再是 NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 不再是 NEXT_PUBLIC_SUPABASE_ANON_KEY
    {
      cookies: {
        getAll() {
          // 更简洁的异步处理方式
          return cookieStore.then(cookies => cookies.getAll())
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStoreInstance = await cookieStore
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStoreInstance.set(name, value, options)
            )
          } catch (error) {
            // 忽略在 Server Component 中设置 cookie 的错误
          }
        },
      },
    }
  )
}