import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UserService } from "@/lib/user";

const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        if (!profile?.email) {
          console.error('Google profile missing email');
          return false;
        }

        try {
          console.log('🔐 Google sign-in attempt:', {
            email: profile.email,
            name: profile.name,
            hasAvatar: !!(profile as any).picture || !!profile.image
          });

          const result = await UserService.upsertUserByEmail(profile.email, {
            name: profile.name,
            avatar: (profile as any).picture || profile.image
          });

          if (result.error) {
            console.error('❌ Failed to upsert user:', result.error);
            return false;
          }

          console.log('✅ User upserted successfully:', result.data?.id);
        } catch (error) {
          console.error('❌ Error upserting user:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const dbUser = await UserService.getUserByEmail(user.email);
          if (dbUser.data) {
            token.userId = dbUser.data.id;
            console.log('🔑 JWT: Added userId to token:', dbUser.data.id);
          } else if (dbUser.error) {
            console.error('❌ JWT: Error getting user by email:', dbUser.error);
          }
        } catch (error) {
          console.error('❌ JWT: Unexpected error:', error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;

        // 从数据库获取用户头像信息
        try {
          const dbUser = await UserService.getCurrentUser(token.userId as string);
          if (dbUser.data?.avatar) {
            session.user.image = dbUser.data.avatar;
            console.log('👤 Session: Added avatar to session');
          } else if (dbUser.error) {
            console.error('❌ Session: Error fetching user avatar:', dbUser.error);
          }
        } catch (error) {
          console.error('❌ Session: Unexpected error fetching avatar:', error);
        }
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };