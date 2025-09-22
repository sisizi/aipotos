import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { Account, Profile } from 'next-auth'

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({account, profile}: {account: Account | null, profile?: Profile}) {
      if (account?.provider === "google") {
        return (profile as any)?.email_verified && (profile as any)?.email?.endsWith("@gmail.com")
      }
      return true;
    }
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }