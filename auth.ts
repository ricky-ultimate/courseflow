import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth } = NextAuth({
  providers: [
    Google({
      profile(profile) {
        return { role: profile.role ?? "user", ...profile }; // Complete the object spread
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && typeof user.role === "string") {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.role && typeof token.role === "string") {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
