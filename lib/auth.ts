import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase";


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 30000, // 增加到30秒超时
      },
      // 手动指定所有OAuth端点，避免discovery超时
      authorization: {
        url: "https://accounts.google.com/oauth/authorize",
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
      // 手动指定JWKS端点
      jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
      // 指定issuer避免自动发现
      issuer: "https://accounts.google.com",
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    error: '/auth/error',
  },
  // logger: {
  //   error(code, metadata) {
  //     console.error('❌ NextAuth Error Code:', code);
  //     console.error('❌ NextAuth Error Metadata:', metadata);

  //     if (code === 'SIGNIN_OAUTH_ERROR') {
  //       console.error('🔥 Google OAuth连接失败 - 可能的原因:');
  //       console.error('1. 网络无法访问Google服务器');
  //       console.error('2. 需要使用代理或VPN');
  //       console.error('3. Google Cloud Console配置问题');
  //       console.error('4. 重定向URI配置错误');
  //     }
  //   },
  //   warn(code) {
  //     console.warn('⚠️ NextAuth Warning:', code);
  //   },
  //   debug(code, metadata) {
  //     console.log('🐛 NextAuth Debug:', code, metadata);
  //   }
  // },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // 检查用户是否存在
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('user_email', user.email!)
            .single();

          if (!existingUser) {
            const initialCredits = 10;

            // 用户不存在,创建新用户
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                user_email: user.email!,
                name: user.name!,
                remaining_credits: initialCredits
              });

            if (insertError) {
              console.error('Error creating user:', insertError);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.error("Database error:", error);
          return false;
        }
      }
      return true;
    }
  }
};