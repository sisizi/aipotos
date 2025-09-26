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
          throw new Error('No profile email');
        }

        try {
          await UserService.upsertUserByEmail(profile.email, {
            name: profile.name,
            avatar: (profile as any).picture || profile.image
          });
        } catch (error) {
          console.error('Error upserting user:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await UserService.getUserByEmail(user.email);
        if (dbUser.data) {
          token.userId = dbUser.data.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };