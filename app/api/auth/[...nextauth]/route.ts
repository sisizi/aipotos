import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { HttpsProxyAgent } from 'https-proxy-agent'
import https from 'https'

// 配置本地 VPN 代理
const proxyUrl = process.env.HTTPS_PROXY || 'http://127.0.0.1:7897';
const agent = new HttpsProxyAgent(proxyUrl);

// 配置全局代理
https.globalAgent = agent;

const authOptions = {
  providers: [
    GoogleProvider({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      httpOptions: {
        timeout: 30000,
        agent: agent
      },
authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
  //     token: "https://oauth2.googleapis.com/token",
  //     userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
  //     jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
  //     issuer: "https://accounts.google.com",
  //   })
  // ],
  // session: {
  //   strategy: 'jwt' as const,
  // },
  // debug: process.env.NODE_ENV === 'development',
  // pages: {
  //   error: '/auth/error',
  }),
  ],
  callbacks: {
    async signIn({account, profile}: any) {
      if (account?.provider === "google") {
        return profile?.email_verified && profile?.email?.endsWith("@gmail.com")
      }
      return true;
    }
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }